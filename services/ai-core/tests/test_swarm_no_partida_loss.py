"""Garantía de COBERTURA del swarm: ninguna partida medida desaparece.

Contexto (incidente Quatre Cantons, 2026-09-10): un BC3 con 36 partidas produjo
un presupuesto de solo 13 porque el swarm, bajo 429/omisión del LLM, DESCARTABA
en silencio las partidas que fallaban en cualquiera de sus 4 puntos:
  A) crash al obtener candidatos (`_analyze_and_deconstruct`/vector) → item dropeado.
  B) chunk de pricing caído (429/circuit_breaker) → todo el chunk perdido.
  C) el evaluador batch OMITE códigos de su respuesta → esos códigos se pierden.
  D) error al construir la partida → `item_skipped`, sin reemplazo.

Fix: reconciliación input↔output al final de `evaluate_batch`. Toda partida
esperada (post-resume) que el swarm no resolvió se RECUPERA como fallback
`from_scratch`/`needs_human_review` (precio 0, o el del BC3 si lo trae), NUNCA
se descarta. Estos tests fijan esa invariante: `codes(salida) ⊇ codes(entrada)`.
"""
from __future__ import annotations

import asyncio
import re
from typing import Any, Dict, List

import pytest

from src.budget.application.ports.ports import (
    IGenerationEmitter,
    ILLMProvider,
    IVectorSearch,
)
from src.budget.application.services.pdf_extractor_service import RestructuredItem
from src.budget.application.services.swarm_pricing_service import (
    BatchPricedItemV3,
    BatchPricingEvaluatorResultV3,
    PricingFinalResultDB,
    SwarmPricingService,
)


class _SpyEmitter(IGenerationEmitter):
    def __init__(self):
        self.events: List[Dict[str, Any]] = []

    def emit_event(self, budget_id, event_type, data):
        self.events.append({"type": event_type, "data": data})


class _OmittingLLM(ILLMProvider):
    """Fake LLM que puede OMITIR códigos de la respuesta de pricing, o REVENTAR
    en la fase de deconstrucción o de pricing, para simular 429/omisión."""

    def __init__(self, *, omit=frozenset(), raise_on_pricing=False,
                 raise_on_deconstruct=False, price=100.0):
        self.omit = set(omit)
        self.raise_on_pricing = raise_on_pricing
        self.raise_on_deconstruct = raise_on_deconstruct
        self.price = price

    async def generate_structured(self, system_prompt, user_prompt, response_schema, **kwargs):
        name = response_schema.__name__
        if name == "DeconstructResult":
            if self.raise_on_deconstruct:
                raise RuntimeError("simulated 429 in deconstruct (candidate fetch)")
            return response_schema(is_complex=False, queries=["q"]), {}
        if name == "BatchPricingEvaluatorResultV3":
            if self.raise_on_pricing:
                raise RuntimeError("simulated 429 in pricing chunk")
            # Los códigos del chunk viven en el user_prompt ("PARTIDA CÓDIGO: X").
            codes = re.findall(r"PARTIDA CÓDIGO:\s*(\S+)", user_prompt)
            results = [
                BatchPricedItemV3(
                    item_code=c,
                    valuation=PricingFinalResultDB(
                        pensamiento_calculista="ok",
                        calculated_unit_price=self.price,
                        needs_human_review=False,
                        match_kind="1:1",
                    ),
                )
                for c in codes if c not in self.omit
            ]
            return BatchPricingEvaluatorResultV3(results=results), {}
        raise AssertionError(f"Schema inesperado: {name}")

    async def get_embedding(self, text: str):
        return [0.0] * 768


class _StrongVS(IVectorSearch):
    def search_similar_items(self, query_vector, query_text, limit=4, **kwargs):
        return [{"id": "C1", "code": "C1", "description": "cand",
                 "matchScore": 0.9, "unit": "m2", "priceTotal": 50.0}]


def _svc(llm, emitter):
    return SwarmPricingService(llm_provider=llm, vector_search=_StrongVS(), emitter=emitter)


def _items(*codes):
    return [RestructuredItem(code=c, description=f"Partida {c}", quantity=2.0,
                             unit="m2", chapter="A") for c in codes]


@pytest.fixture(autouse=True)
def _prompt_patch(monkeypatch):
    # Evita I/O de disco y expone los códigos del chunk en el user_prompt.
    monkeypatch.setattr(
        SwarmPricingService, "_load_prompt",
        lambda self, filename, **kwargs: ("sys", kwargs.get("batch_items", "")),
    )
    monkeypatch.delenv("ENABLE_PRO_PRICING", raising=False)


def _codes(partidas):
    return {p.code for p in partidas}


# ---- C: el evaluador batch OMITE códigos ------------------------------------

def test_omitted_partida_is_recovered_as_fallback():
    """Si el LLM omite un código de su respuesta, la partida NO se pierde:
    aparece como fallback from_scratch + needs_review, precio 0."""
    emitter = _SpyEmitter()
    llm = _OmittingLLM(omit={"MISS.1"})
    priced = asyncio.run(_svc(llm, emitter).evaluate_batch(
        _items("OK.1", "MISS.1"), budget_id="b", metrics={"prompt": 0, "completion": 0, "total": 0, "cost": 0.0}))

    assert _codes(priced) == {"OK.1", "MISS.1"}, "ninguna partida puede desaparecer"
    miss = next(p for p in priced if p.code == "MISS.1")
    assert miss.match_kind == "from_scratch"
    assert miss.ai_resolution.needs_human_review is True
    assert miss.matchConfidence == 40
    assert miss.unitPrice == 0.0
    ok = next(p for p in priced if p.code == "OK.1")
    assert ok.unitPrice == pytest.approx(100.0)
    recovered = [e for e in emitter.events if e["type"] == "partida_fallback_recovered"]
    assert [e["data"]["code"] for e in recovered] == ["MISS.1"]


# ---- B: el chunk de pricing revienta (429) ----------------------------------

def test_partida_recovered_when_pricing_chunk_raises():
    """Si la llamada de pricing revienta (429/circuit_breaker), la partida se
    recupera como fallback en vez de perderse con el chunk."""
    emitter = _SpyEmitter()
    llm = _OmittingLLM(raise_on_pricing=True)
    priced = asyncio.run(_svc(llm, emitter).evaluate_batch(
        _items("X.1"), budget_id="b", metrics={"prompt": 0, "completion": 0, "total": 0, "cost": 0.0}))

    assert _codes(priced) == {"X.1"}
    assert priced[0].match_kind == "from_scratch"
    assert priced[0].ai_resolution.needs_human_review is True


# ---- A: la obtención de candidatos revienta ---------------------------------

def test_partida_recovered_when_candidate_fetch_raises():
    """Si `_analyze_and_deconstruct` (Flash) revienta al obtener candidatos, la
    partida no se dropea: se conserva como fallback."""
    emitter = _SpyEmitter()
    llm = _OmittingLLM(raise_on_deconstruct=True)
    priced = asyncio.run(_svc(llm, emitter).evaluate_batch(
        _items("X.1"), budget_id="b", metrics={"prompt": 0, "completion": 0, "total": 0, "cost": 0.0}))

    assert _codes(priced) == {"X.1"}
    assert priced[0].match_kind == "from_scratch"


# ---- Happy path: sin pérdidas no hay fallbacks ------------------------------

def test_no_fallback_when_all_resolved():
    """Si el LLM devuelve todas, NO se crea ningún fallback (sin ruido)."""
    emitter = _SpyEmitter()
    llm = _OmittingLLM()  # no omite nada
    priced = asyncio.run(_svc(llm, emitter).evaluate_batch(
        _items("A.1", "A.2"), budget_id="b", metrics={"prompt": 0, "completion": 0, "total": 0, "cost": 0.0}))

    assert _codes(priced) == {"A.1", "A.2"}
    assert all(p.unitPrice == pytest.approx(100.0) for p in priced)
    assert [e for e in emitter.events if e["type"] == "partida_fallback_recovered"] == []


# ---- Escala: proyecto grande con omisión parcial ----------------------------

def test_large_project_partial_omission_loses_nothing():
    """20 partidas, el LLM omite 7: la salida conserva las 20 (7 como fallback)."""
    all_codes = [f"P.{i}" for i in range(20)]
    omit = {f"P.{i}" for i in (2, 5, 7, 11, 13, 17, 19)}
    emitter = _SpyEmitter()
    llm = _OmittingLLM(omit=omit)
    priced = asyncio.run(_svc(llm, emitter).evaluate_batch(
        _items(*all_codes), budget_id="b", metrics={"prompt": 0, "completion": 0, "total": 0, "cost": 0.0}))

    assert _codes(priced) == set(all_codes), "cobertura completa incluso a escala"
    fallbacks = {p.code for p in priced if p.match_kind == "from_scratch" and p.unitPrice == 0.0}
    assert fallbacks == omit
    cov = [e for e in emitter.events if e["type"] == "coverage_reconciliation"]
    assert cov and cov[0]["data"]["recovered_fallback"] == len(omit)
    assert cov[0]["data"]["expected"] == 20
