"""Prueba end-to-end del vector search sobre price_book_2025 con gemini-embedding-2.

Embebe queries de reforma reales (RETRIEVAL_QUERY, 768, @global) y hace
find_nearest COSINE contra price_book_2025. Imprime top-K con code/chapter/
description/distancia. Valida: (1) los vectores -2 recién ingestados, (2) los
índices vectoriales, (3) la consistencia doc/query.

Uso:
    python scripts/test_search_pricebook_v2.py
"""
from __future__ import annotations

import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
from google.cloud.firestore_v1.vector import Vector
from google import genai
from google.genai import types

PROJECT = "express-renovation"
os.environ.setdefault("FIREBASE_PROJECT_ID", PROJECT)

QUERIES = [
    "quitar los azulejos del baño y picar el alicatado",
    "pintura plástica blanca en paredes y techos",
    "instalación de inodoro con cisterna",
    "solado con baldosa de gres porcelánico",
    "puerta de paso de madera lacada en blanco",
    "instalación eléctrica de vivienda, cableado y mecanismos",
    "ventana de aluminio con rotura de puente térmico",
    "demolición de tabique de ladrillo",
]


def main() -> int:
    try:
        firebase_admin.initialize_app(options={"projectId": PROJECT})
    except ValueError:
        pass
    db = firestore.client()
    coll = db.collection("price_book_2025")

    client = genai.Client(vertexai=True, project=PROJECT, location="global")
    cfg = types.EmbedContentConfig(output_dimensionality=768, task_type="RETRIEVAL_QUERY")

    for q in QUERIES:
        r = client.models.embed_content(model="gemini-embedding-2", contents=q, config=cfg)
        qv = list(r.embeddings[0].values[:768])
        res = coll.find_nearest(
            vector_field="embedding",
            query_vector=Vector(qv),
            distance_measure=DistanceMeasure.COSINE,
            limit=5,
        ).get()
        print(f"\n>>> {q!r}")
        for doc in res:
            d = doc.to_dict()
            code = d.get("code", "?")
            ch = (d.get("chapter") or "")[:22]
            desc = (d.get("description") or "")[:78].replace("\n", " ")
            kind = d.get("kind", "?")
            print(f"   [{kind:9}] {code:12} | {ch:22} | {desc}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
