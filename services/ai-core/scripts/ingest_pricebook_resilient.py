"""Ingesta RESILIENTE de price_book_2025 (enriquecido, gemini-embedding-2 @global).

Por qué existe: gemini-embedding-2 en proyecto nuevo tiene una ráfaga grande
pero throttling por-segundo/ráfaga conservador; los runs "embebe-todo-y-escribe"
mueren tras varios miles de embeddings (una llamada agota reintentos → aborta y
pierde TODO). Este script:

  - Procesa por CHUNKS y ESCRIBE cada chunk (checkpoint) → nunca pierde progreso.
  - Reintenta 429 SIN rendirse (backoff acotado) → una llamada nunca aborta el run.
  - Es REANUDABLE: al arrancar salta los doc_id que ya existen en Firestore.
  - Concurrencia baja (2) para no disparar el throttling.

Credenciales: ADC. Fuerza project express-renovation vía env.

Uso:
    python scripts/ingest_pricebook_resilient.py --commit
    # (sin --commit: dry-run, cuenta pendientes y muestra 2 textos)
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import random
import sys
import time
from pathlib import Path

import firebase_admin
from firebase_admin import firestore

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[1]
sys.path.insert(0, str(ROOT))

from src.budget.catalog.application.services.catalog_transformer import (  # noqa: E402
    CatalogTransformer,
)
from src.budget.catalog.domain.price_book_entry import EmbeddingTextBuilder  # noqa: E402
from src.budget.catalog.infrastructure.adapters.firestore_price_book_repository import (  # noqa: E402
    FirestorePriceBookRepository,
    PRICE_BOOK_COLLECTION,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

SOURCE = REPO_ROOT / "docs" / "2025_variable_final.enriched.json"
MODEL = "gemini-embedding-2"
DIM = 768
CHUNK = 100          # entries embebidas+escritas por vuelta (checkpoint)
CONCURRENCY = 2      # bajo → no dispara el throttling de ráfaga
CAP_BACKOFF = 20.0   # s


def _init_fb() -> None:
    import os
    pid = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get("GCLOUD_PROJECT") or "express-renovation"
    try:
        firebase_admin.initialize_app(options={"projectId": pid})
        logger.info("Firebase ADC (project=%s).", pid)
    except ValueError:
        pass


def _is_429(exc: Exception) -> bool:
    m = str(exc).lower()
    return "429" in m or "resource_exhausted" in m or "too many requests" in m or "rate limit" in m


def _doc_id(entry) -> str:
    return getattr(entry, "doc_id", None) or entry.code


async def run(commit: bool) -> int:
    from google import genai
    from google.genai import types

    logger.info("Transformando %s…", SOURCE.name)
    source = json.load(SOURCE.open("r", encoding="utf-8"))
    items, breakdowns = CatalogTransformer.transform(source)
    # (entry, text) para items y breakdowns
    work = [(it, EmbeddingTextBuilder.for_item(it)) for it in items]
    work += [(bk, EmbeddingTextBuilder.for_breakdown(bk)) for bk in breakdowns]
    logger.info("Entries totales: %d (items=%d, breakdowns=%d)", len(work), len(items), len(breakdowns))

    _init_fb()
    db = firestore.client()
    repo = FirestorePriceBookRepository(db=db)

    # Reanudar: doc_ids ya presentes (se asume que si existe, ya tiene embedding).
    existing: set[str] = set()
    for ref in db.collection(PRICE_BOOK_COLLECTION).list_documents(page_size=1000):
        existing.add(ref.id)
    if existing:
        logger.info("Reanudando: %d docs ya existen, se saltan.", len(existing))
    pending = [(e, t) for (e, t) in work if _doc_id(e) not in existing]
    logger.info("Pendientes a embeber: %d", len(pending))

    if not commit:
        for e, t in pending[:2]:
            logger.info("  ej %s -> %r", _doc_id(e), t[:110])
        logger.info("Dry-run. Pasa --commit para embeber+escribir.")
        return 0

    client = genai.Client(vertexai=True, project="express-renovation", location="global")
    cfg = types.EmbedContentConfig(output_dimensionality=DIM, task_type="RETRIEVAL_DOCUMENT")
    sem = asyncio.Semaphore(CONCURRENCY)

    def _embed_sync(text: str) -> list[float]:
        # Reintento 429 SIN rendirse (backoff acotado). Lanza en errores no-429.
        delay = 1.0
        while True:
            try:
                r = client.models.embed_content(model=MODEL, contents=text, config=cfg)
                return list(r.embeddings[0].values[:DIM])
            except Exception as e:
                if not _is_429(e):
                    raise
                time.sleep(min(delay, CAP_BACKOFF) + random.uniform(0, 0.5))
                delay = min(delay * 1.5, CAP_BACKOFF)

    async def _embed(text: str) -> list[float]:
        async with sem:
            return await asyncio.to_thread(_embed_sync, text)

    total = len(pending)
    done = 0
    t0 = time.time()
    for start in range(0, total, CHUNK):
        chunk = pending[start : start + CHUNK]
        vecs = await asyncio.gather(*[_embed(t) for (_e, t) in chunk])
        await repo.save_price_book_entries_batch([(e, v) for (e, _t), v in zip(chunk, vecs)])
        done += len(chunk)
        el = time.time() - t0
        rate = done / el if el else 0
        eta = (total - done) / rate / 60 if rate else 0
        logger.info("checkpoint %d/%d escritos | %.1f/s | ETA ~%.0f min", done, total, rate, eta)

    logger.info("✅ Ingesta completada: %d entries en price_book_2025.", done)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingesta resiliente price_book_2025 (gemini-embedding-2).")
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()
    return asyncio.run(run(commit=args.commit))


if __name__ == "__main__":
    sys.exit(main())
