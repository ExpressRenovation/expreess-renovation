"""Adapter `GeminiEmbeddingProvider` — batch embeddings vía Vertex AI.

Usa el SDK `google.genai` en modo Vertex (ADC del service-account de runtime,
pago por uso). Requiere el rol `roles/aiplatform.user` en el SA. Misma vía que
el resto del sistema (`gemini_adapter.py:get_embedding`).

Modelo: `gemini-embedding-001` (MRL, 3072 dims por defecto). Truncamos a
768 para:
  - Entrar en el ceiling de Firestore (vectores ≤ 2048 dims).
  - Coincidir con la query del adapter existente
    (`firestore_price_book.py` ya trunca a 768).

Rate limit: el free tier de Gemini es 100 RPM. Cuando burstamos batches
seguidos en la reindex, el SDK devuelve `429 RESOURCE_EXHAUSTED`. El
provider reintenta con backoff exponencial + jitter; opcionalmente se
añade un `inter_batch_delay` para throttle preventivo entre llamadas.
"""

from __future__ import annotations

import asyncio
import logging
import os
import random
from typing import Any

from src.budget.catalog.application.ports.embedding_provider import IEmbeddingProvider
from src.budget.infrastructure.config.model_registry import get_model

logger = logging.getLogger(__name__)

_MODEL = "gemini-embedding-2"

# gemini-embedding-001 es MRL (Matryoshka) y devuelve 3072 dims por defecto.
# Firestore acepta vectores de ≤ 2048 dims. Truncamos a 768 (coincide con
# `firestore_price_book.py:46` que trunca la query al mismo valor).
# Truncar MRL es válido por diseño: los primeros N dims son embedding
# auto-contenido.
_FIRESTORE_DIM_LIMIT = 768


def _is_rate_limit_error(exc: Exception) -> bool:
    """Heurística simple: detecta 429 / RESOURCE_EXHAUSTED en mensaje.

    Preferimos string matching a `isinstance` porque el SDK puede cambiar
    la jerarquía de excepciones entre versiones.
    """
    msg = str(exc).lower()
    return "429" in msg or "resource_exhausted" in msg or "rate limit" in msg


class GeminiEmbeddingProvider(IEmbeddingProvider):
    def __init__(
        self,
        *,
        max_retries: int = 8,
        # Backoff suave y ACOTADO (cap 8s): un 429 puntual se reintenta rápido.
        base_delay: float = 1.0,
        inter_batch_delay: float = 0.7,
        # OJO: gemini-embedding-2 en proyecto nuevo tiene una RÁFAGA grande
        # (~2000) pero un enforcement por-segundo/concurrente conservador. Medido:
        # serie (conc=1) → 7/s LIMPIO sostenido; conc=2 → 13/s LIMPIO sobre 500;
        # conc=4 → colapsa tras ~2137 (429 en tromba). Usamos conc=2 (rápido y
        # por debajo del umbral de ráfaga) + 8 reintentos que absorben 429
        # puntuales sin abortar la ingesta.
        concurrency: int = 2,
    ) -> None:
        project = (
            os.environ.get("GOOGLE_CLOUD_PROJECT")
            or os.environ.get("GCLOUD_PROJECT")
            or os.environ.get("FIREBASE_PROJECT_ID")
        )
        if not project:
            raise RuntimeError(
                "GeminiEmbeddingProvider requires GOOGLE_CLOUD_PROJECT / GCLOUD_PROJECT / "
                "FIREBASE_PROJECT_ID (Vertex AI)."
            )
        # gemini-embedding-2 SOLO se sirve en el endpoint `global` (y su cuota
        # es global). Desacoplamos de GOOGLE_CLOUD_LOCATION, que apunta a
        # europe-southwest1 para el LLM flash.
        location = os.environ.get("EMBEDDING_LOCATION", "global")
        from google import genai
        self._client: Any = genai.Client(vertexai=True, project=project, location=location)
        # Phase 0 — embedding model id from the configurable registry
        # (``model_registry/embedding``), TTL-cached + non-fatal; falls back to
        # ``_MODEL`` (``gemini-embedding-001``) with no doc present. Dims stay at
        # ``_FIRESTORE_DIM_LIMIT`` (768) — NEVER driven by the registry, since
        # changing dims would invalidate every stored vector.
        self._model = get_model("embedding", default_model_id=_MODEL).model_id
        self._max_retries = max_retries
        self._base_delay = base_delay
        # Throttle preventivo entre batches — 0.7s da <90 RPM, por debajo del
        # free tier de 100 RPM con algo de margen.
        self._inter_batch_delay = inter_batch_delay
        self._concurrency = concurrency

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        from google.genai import types

        config = types.EmbedContentConfig(
            output_dimensionality=_FIRESTORE_DIM_LIMIT,
            task_type="RETRIEVAL_DOCUMENT",
        )
        # gemini-embedding-2 (metodo `embedContent`) embebe UNA content por
        # llamada — NO soporta batch como gemini-embedding-001 (`predict` con
        # `instances`). Embebemos cada texto individualmente con concurrencia
        # acotada; la cuota de -2 (6000/min global) da margen de sobra y el
        # backoff absorbe cualquier 429 puntual. Se preserva el ORDEN.
        sem = asyncio.Semaphore(self._concurrency)

        async def _embed_one(text: str) -> list[float]:
            last_exc: Exception | None = None
            for attempt in range(self._max_retries):
                try:
                    async with sem:
                        response = await asyncio.to_thread(
                            self._client.models.embed_content,
                            model=self._model,
                            contents=text,
                            config=config,
                        )
                    vals = response.embeddings[0].values
                    if not vals:
                        raise RuntimeError("empty embedding returned")
                    return list(vals[:_FIRESTORE_DIM_LIMIT])
                except Exception as e:
                    last_exc = e
                    if not _is_rate_limit_error(e) or attempt == self._max_retries - 1:
                        raise
                    delay = min(self._base_delay * (2 ** attempt), 8.0) + random.uniform(0, 1)
                    await asyncio.sleep(delay)
            raise RuntimeError(f"embed_one exhausted retries: {last_exc}")

        return await asyncio.gather(*[_embed_one(t) for t in texts])
