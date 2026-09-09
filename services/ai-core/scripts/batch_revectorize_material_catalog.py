"""Re-vectoriza `material_catalog` (OBRAMAT) con gemini-embedding-2 vía **Vertex
BatchPredictionJob** — la vía RÁPIDA (cuota de batch separada y alta, corre async
en un solo job de minutos vs. ~2.3h del online resiliente).

Por qué batch y no online:
  gemini-embedding-2 en proyecto nuevo tiene ráfaga grande pero throttling
  sostenido bajo (~2.2/s) en el endpoint online. El BatchPredictionJob usa otra
  cuota, mucho más alta, y no cuenta contra el online. 18k items → 1 job.

Formato de input Gemini (VALIDADO, NO es `{"content":...}` de -001):
    {"request":{"content":{"parts":[{"text":TEXT}]},
                "outputDimensionality":768,"taskType":"RETRIEVAL_DOCUMENT"}}
  El output echoa `request` y añade `response.embedding.values` (768 floats).
  Mapeamos texto→doc_id en el writeback (el embedding es función pura del texto,
  así que textos duplicados comparten vector sin ambigüedad).

Modelo SOLO `global`: `publishers/google/models/gemini-embedding-2` en
`locations/global`. Los endpoints regionales devuelven 404.

Fases (idempotentes, reanudables):
    # 1) Lee Firestore, escribe input.jsonl (sin BOM) + mapping.json, sube a GCS.
    python scripts/batch_revectorize_material_catalog.py --build
    # 2) Crea el batch job (imprime job name; se guarda en state.json).
    python scripts/batch_revectorize_material_catalog.py --submit
    # 3) Consulta estado.
    python scripts/batch_revectorize_material_catalog.py --poll
    # 4) Descarga predicciones, escribe embedding (Vector 768) en Firestore.
    python scripts/batch_revectorize_material_catalog.py --writeback

Credenciales: ADC. Fuerza project express-renovation vía env.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1.vector import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

PROJECT = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get("GCLOUD_PROJECT") or "express-renovation"
COLLECTION = "material_catalog"
MODEL = "publishers/google/models/gemini-embedding-2"
LOCATION = "global"
DIM = 768
TASK_TYPE = "RETRIEVAL_DOCUMENT"

BUCKET = "express-renovation-pipeline-uploads"
GCS_PREFIX = f"gs://{BUCKET}/batch-matcat"
GCS_INPUT = f"{GCS_PREFIX}/input.jsonl"
GCS_OUTPUT = f"{GCS_PREFIX}/out/"

# Estado local (scratchpad del repo, git-ignored via scripts/.cache).
CACHE = ROOT / "scripts" / ".batch_cache"
INPUT_LOCAL = CACHE / "input.jsonl"
MAPPING_LOCAL = CACHE / "mapping.json"   # {text: [doc_id, ...]}
STATE_LOCAL = CACHE / "state.json"       # {job_name, output_prefix}
CKPT_LOCAL = CACHE / "writeback_ckpt.json"  # {job_name, done_rows} — reanudación del writeback
WRITE_BATCH = 400                        # ops por batch Firestore (< 500)


def _load_writeback_ckpt(job_name: str) -> int:
    """Filas de predicción YA committeadas a Firestore para ESTE job.

    Ligado al `job_name`: si el checkpoint es de otro job (re-submit), se ignora
    (empieza de 0). Semántica: todas las filas con índice < done_rows están
    íntegramente escritas.
    """
    if CKPT_LOCAL.exists():
        try:
            d = json.loads(CKPT_LOCAL.read_text(encoding="utf-8"))
            if d.get("job_name") == job_name:
                return int(d.get("done_rows", 0))
        except (ValueError, TypeError):
            pass
    return 0


def _save_writeback_ckpt(job_name: str, done_rows: int) -> None:
    CKPT_LOCAL.write_text(
        json.dumps({"job_name": job_name, "done_rows": done_rows}), encoding="utf-8"
    )


def _init_fb() -> None:
    try:
        firebase_admin.initialize_app(options={"projectId": PROJECT})
        logger.info("Firebase ADC (project=%s).", PROJECT)
    except ValueError:
        pass


def _embed_text(data: dict) -> str:
    name = (data.get("name") or "").strip()
    desc = (data.get("description") or "").strip()
    cat = (data.get("category") or "").strip()
    parts = [p for p in [name, desc] if p]
    text = ". ".join(parts)
    if cat:
        text += f". Categoría: {cat}"
    return text or name or "material"


def _token() -> str:
    acct = os.environ.get("GCLOUD_ACCOUNT", "expressrenovation.platform@gmail.com")
    out = subprocess.run(
        ["gcloud", "auth", "print-access-token", f"--account={acct}"],
        capture_output=True, text=True, shell=True,
    )
    tok = (out.stdout or "").strip()
    if not tok:
        raise RuntimeError(f"no access token: {out.stderr}")
    return tok


def _gcloud(*args: str) -> str:
    acct = os.environ.get("GCLOUD_ACCOUNT", "expressrenovation.platform@gmail.com")
    cmd = ["gcloud", *args, f"--project={PROJECT}", f"--account={acct}"]
    out = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if out.returncode != 0:
        raise RuntimeError(f"gcloud {' '.join(args)} failed: {out.stderr}")
    return out.stdout


def build() -> int:
    _init_fb()
    db = firestore.client()
    coll = db.collection(COLLECTION)
    CACHE.mkdir(parents=True, exist_ok=True)

    logger.info("Leyendo docs de %s (id + name/description/category)…", COLLECTION)
    mapping: dict[str, list[str]] = {}
    n = 0
    for snap in coll.select(["name", "description", "category"]).stream():
        text = _embed_text(snap.to_dict() or {})
        mapping.setdefault(text, []).append(snap.id)
        n += 1
        if n % 2000 == 0:
            logger.info("  leidos %d…", n)
    uniq = len(mapping)
    logger.info("Total docs: %d | textos únicos: %d", n, uniq)

    # input.jsonl: una línea por TEXTO ÚNICO (evita re-embeber duplicados).
    with INPUT_LOCAL.open("w", encoding="utf-8", newline="\n") as f:
        for text in mapping:
            line = {
                "request": {
                    "content": {"parts": [{"text": text}]},
                    "outputDimensionality": DIM,
                    "taskType": TASK_TYPE,
                }
            }
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
    MAPPING_LOCAL.write_text(json.dumps(mapping, ensure_ascii=False), encoding="utf-8")
    logger.info("input.jsonl: %d líneas | mapping.json guardado", uniq)

    logger.info("Subiendo input a %s…", GCS_INPUT)
    _gcloud("storage", "cp", str(INPUT_LOCAL), GCS_INPUT)
    logger.info("✅ build listo. Ejecuta --submit.")
    return 0


def submit() -> int:
    token = _token()
    url = f"https://aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/{LOCATION}/batchPredictionJobs"
    body = {
        "displayName": "matcat-embed-gemini2",
        "model": MODEL,
        "inputConfig": {"instancesFormat": "jsonl", "gcsSource": {"uris": [GCS_INPUT]}},
        "outputConfig": {"predictionsFormat": "jsonl", "gcsDestination": {"outputUriPrefix": GCS_OUTPUT}},
    }
    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        resp = json.load(r)
    job_name = resp["name"]
    STATE_LOCAL.write_text(json.dumps({"job_name": job_name}), encoding="utf-8")
    logger.info("✅ Job creado: %s", job_name)
    logger.info("   estado inicial: %s", resp.get("state"))
    return 0


def _job_get() -> dict:
    state = json.loads(STATE_LOCAL.read_text(encoding="utf-8"))
    token = _token()
    url = f"https://aiplatform.googleapis.com/v1/{state['job_name']}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def poll() -> int:
    j = _job_get()
    logger.info("state: %s", j.get("state"))
    if j.get("error"):
        logger.error("error: %s", json.dumps(j["error"])[:800])
    od = (j.get("outputInfo") or {}).get("gcsOutputDirectory")
    if od:
        logger.info("outputDirectory: %s", od)
    return 0


def writeback() -> int:
    _init_fb()
    db = firestore.client()
    coll = db.collection(COLLECTION)
    mapping: dict[str, list[str]] = json.loads(MAPPING_LOCAL.read_text(encoding="utf-8"))

    j = _job_get()
    if j.get("state") != "JOB_STATE_SUCCEEDED":
        logger.error("job no SUCCEEDED (state=%s). Aborto.", j.get("state"))
        return 1
    out_dir = (j.get("outputInfo") or {}).get("gcsOutputDirectory")
    if not out_dir:
        logger.error("sin outputDirectory en el job.")
        return 1
    logger.info("Descargando predicciones de %s…", out_dir)
    listing = _gcloud("storage", "ls", "-r", f"{out_dir.rstrip('/')}/**")
    # Vertex puede FRAGMENTAR el output: predictions.jsonl,
    # predictions-00001-of-0000N.jsonl, etc. Cogemos TODOS.
    pred_uris = [ln.strip() for ln in listing.splitlines()
                 if "predictions" in ln and ln.strip().endswith(".jsonl")]
    if not pred_uris:
        logger.error("no encuentro predictions*.jsonl en:\n%s", listing)
        return 1
    logger.info("archivos de predicciones: %d", len(pred_uris))
    pred_uris.sort()  # orden ESTABLE → el índice de fila es reproducible entre runs

    job_name = json.loads(STATE_LOCAL.read_text(encoding="utf-8"))["job_name"]
    done_rows = _load_writeback_ckpt(job_name)
    if done_rows:
        logger.info("Reanudando writeback: %d filas ya committeadas, se saltan.", done_rows)

    # `row_index` avanza por CADA línea de predicción no vacía (incluidas las que
    # se saltan o fallan al parsear) → alineación estable para el checkpoint.
    # Committeamos SIEMPRE en frontera de fila: al cruzar WRITE_BATCH tras
    # terminar todas las escrituras de la fila actual → el checkpoint (row_index)
    # implica "todas las filas < row_index están íntegras en Firestore".
    row_index = 0
    written, missing, lines = 0, 0, 0
    batch = db.batch()
    pending = 0
    for idx, pred_uri in enumerate(pred_uris):
        local_pred = CACHE / f"predictions_{idx}.jsonl"
        _gcloud("storage", "cp", pred_uri, str(local_pred))
        with local_pred.open("r", encoding="utf-8") as f:
            for raw in f:
                raw = raw.strip()
                if not raw:
                    continue
                lines += 1
                if row_index < done_rows:      # ya committeada en un run previo
                    row_index += 1
                    continue
                row = json.loads(raw)
                try:
                    text = row["request"]["content"]["parts"][0]["text"]
                    vals = row["response"]["embedding"]["values"]
                except (KeyError, IndexError, TypeError):
                    missing += 1
                    row_index += 1
                    continue
                vec = Vector([float(x) for x in vals[:DIM]])
                for doc_id in mapping.get(text, []):
                    batch.update(coll.document(doc_id), {"embedding": vec})
                    pending += 1
                row_index += 1
                if pending >= WRITE_BATCH:     # commit en frontera de fila
                    batch.commit()
                    written += pending
                    pending = 0
                    batch = db.batch()
                    _save_writeback_ckpt(job_name, row_index)
                    if written % 2000 < WRITE_BATCH:
                        logger.info("  escritos %d… (fila %d)", written, row_index)
    if pending:
        batch.commit()
        written += pending
    _save_writeback_ckpt(job_name, row_index)
    logger.info("✅ writeback: %d embeddings escritos | %d líneas pred | %d sin embedding | ckpt fila %d",
                written, lines, missing, row_index)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Batch re-vectorize material_catalog (gemini-embedding-2).")
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--submit", action="store_true")
    ap.add_argument("--poll", action="store_true")
    ap.add_argument("--writeback", action="store_true")
    args = ap.parse_args()
    if args.build:
        return build()
    if args.submit:
        return submit()
    if args.poll:
        return poll()
    if args.writeback:
        return writeback()
    ap.error("elige una fase: --build | --submit | --poll | --writeback")


if __name__ == "__main__":
    sys.exit(main())
