"""Re-vectoriza la colección `material_catalog` (OBRAMAT) con gemini-embedding-2.

Motivo: la query del pricing pasa a gemini-embedding-2@768 (cuota alta,
self-service). Para que el coseno siga siendo válido, los docs del catálogo
de materiales deben re-embeberse con el MISMO modelo. Mantiene 768 dims →
el índice vectorial de Firestore NO cambia.

- Lee todos los docs de `material_catalog` (paginado por cursor).
- Construye el texto de embedding: `"{name}. {description}. Categoría: {category}"`.
- Re-embebe con GeminiEmbeddingProvider (gemini-embedding-2 @global,
  RETRIEVAL_DOCUMENT, concurrencia acotada).
- Actualiza SOLO el campo `embedding` (Vector 768) en batches; NO toca precio,
  nombre, categoría ni ningún otro campo.

Credenciales: ADC (`gcloud auth application-default login`). Fuerza project
express-renovation vía env (evita el local-digital-eye del .env del ai-core).

Uso:
    # Dry-run: cuenta docs y muestra 3 textos de ejemplo, NO escribe ni embebe.
    python scripts/revectorize_material_catalog.py
    # Commit real:
    python scripts/revectorize_material_catalog.py --commit
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path

import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1.vector import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.budget.catalog.infrastructure.adapters.gemini_embedding_provider import (  # noqa: E402
    GeminiEmbeddingProvider,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

COLLECTION = "material_catalog"
EMBED_CHUNK = 200        # textos por llamada a embed_batch (concurrente dentro)
WRITE_BATCH = 400        # ops por batch Firestore (límite 500)


def _init_firebase() -> None:
    import os
    project = (
        os.environ.get("FIREBASE_PROJECT_ID")
        or os.environ.get("GCLOUD_PROJECT")
        or "express-renovation"
    )
    try:
        firebase_admin.initialize_app(options={"projectId": project})
        logger.info("Firebase Admin inicializado con ADC (project=%s).", project)
    except ValueError:
        pass  # ya inicializado


def _embed_text(data: dict) -> str:
    name = (data.get("name") or "").strip()
    desc = (data.get("description") or "").strip()
    cat = (data.get("category") or "").strip()
    parts = [p for p in [name, desc] if p]
    text = ". ".join(parts)
    if cat:
        text += f". Categoría: {cat}"
    return text or name or "material"


async def run(commit: bool) -> int:
    _init_firebase()
    db = firestore.client()
    coll = db.collection(COLLECTION)

    logger.info("Leyendo docs de %s…", COLLECTION)
    # Streaming completo: id + campos necesarios para el texto (sin traer embedding).
    docs: list[tuple[str, str]] = []
    for snap in coll.select(["name", "description", "category"]).stream():
        docs.append((snap.id, _embed_text(snap.to_dict() or {})))
    logger.info("Total docs: %d", len(docs))

    if not commit:
        for i in (0, len(docs) // 2, len(docs) - 1):
            if 0 <= i < len(docs):
                logger.info("  ejemplo[%d] %s -> %r", i, docs[i][0], docs[i][1][:120])
        logger.info("Dry-run: NO se embebe ni escribe (pasa --commit).")
        return 0

    embedder = GeminiEmbeddingProvider()
    total = len(docs)
    written = 0
    for start in range(0, total, EMBED_CHUNK):
        chunk = docs[start : start + EMBED_CHUNK]
        texts = [t for _, t in chunk]
        vectors = await embedder.embed_batch(texts)
        if len(vectors) != len(chunk):
            raise RuntimeError(
                f"embed count mismatch: got {len(vectors)} expected {len(chunk)}"
            )
        # Escribir en sub-batches Firestore.
        for w in range(0, len(chunk), WRITE_BATCH):
            batch = db.batch()
            for (doc_id, _), vec in zip(chunk[w : w + WRITE_BATCH], vectors[w : w + WRITE_BATCH]):
                batch.update(coll.document(doc_id), {"embedding": Vector(vec[:768])})
            batch.commit()
            written += len(chunk[w : w + WRITE_BATCH])
        logger.info("  progreso: %d/%d", written, total)

    logger.info("✅ Re-vectorización completada: %d docs actualizados.", written)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Re-vectoriza material_catalog con gemini-embedding-2.")
    parser.add_argument("--commit", action="store_true", help="Escribir en Firestore (default: dry-run).")
    args = parser.parse_args()
    return asyncio.run(run(commit=args.commit))


if __name__ == "__main__":
    sys.exit(main())
