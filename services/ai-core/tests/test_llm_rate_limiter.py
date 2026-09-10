"""Rate-limiter GLOBAL de llamadas LLM (token-bucket asíncrono).

Objetivo (incidente 429 Quatre Cantons / Grupo RG): `gemini-2.5-flash` en Vertex
usa Dynamic Shared Quota — un pool por región que devuelve 429 bajo ráfaga. El
swarm ya no PIERDE partidas (reconciliación), pero un 429 deja partidas sin
componer (fallback a 0). `SWARM_CONCURRENCY` solo estrangula el pricing; la
extracción + deconstrucción + compositor también queman el pool. La solución es
un **rate-limit GLOBAL** en el único chokepoint por el que pasan TODAS las
llamadas Flash: `GoogleGenerativeAIAdapter.generate_structured`.

Diseño testeable: `AsyncTokenBucket` con `now_fn`/`sleep_fn` inyectables → tests
deterministas sin tiempo real (sleeping AVANZA el reloj falso). Off por defecto
(`LLM_MAX_RPM` ausente/0 → `_NoopLimiter`, sin cambio de comportamiento).

Nota: todos los tests que ejercitan el bucket son ``@pytest.mark.asyncio`` (NO
``asyncio.run``) — mezclar ``asyncio.run`` con pytest-asyncio en un mismo fichero
corrompe el event loop y cuelga la suite.
"""
from __future__ import annotations

from types import SimpleNamespace

import pytest
from pydantic import BaseModel

from src.budget.infrastructure.adapters.ai.llm_rate_limiter import (
    AsyncTokenBucket,
    _NoopLimiter,
    build_limiter_from_env,
    get_llm_rate_limiter,
    reset_llm_rate_limiter_for_tests,
)


def _fake_clock():
    """Reloj falso: `now()` lee el valor; `sleep(d)` lo AVANZA (determinista)."""
    state = {"t": 0.0}
    slept: list[float] = []

    def now() -> float:
        return state["t"]

    async def sleep(d: float) -> None:
        slept.append(d)
        state["t"] += d

    return state, now, sleep, slept


# ---- AsyncTokenBucket (puro) ------------------------------------------------

@pytest.mark.asyncio
async def test_burst_up_to_capacity_does_not_wait():
    _, now, sleep, slept = _fake_clock()
    b = AsyncTokenBucket(rate_per_sec=10.0, capacity=5.0, now_fn=now, sleep_fn=sleep)
    for _ in range(5):
        await b.acquire()
    assert slept == [], "5 tokens de burst → sin espera"


@pytest.mark.asyncio
async def test_throttles_when_capacity_exhausted():
    _, now, sleep, slept = _fake_clock()
    b = AsyncTokenBucket(rate_per_sec=10.0, capacity=2.0, now_fn=now, sleep_fn=sleep)
    for _ in range(4):  # 2 de burst + 2 que esperan 1/rate = 0.1s c/u
        await b.acquire()
    assert len(slept) == 2
    assert all(abs(s - 0.1) < 1e-9 for s in slept), slept


@pytest.mark.asyncio
async def test_refills_over_time():
    state, now, sleep, slept = _fake_clock()
    b = AsyncTokenBucket(rate_per_sec=10.0, capacity=1.0, now_fn=now, sleep_fn=sleep)
    await b.acquire()      # gasta el único token
    state["t"] += 1.0      # pasa 1s → +10 tokens (cap 1)
    await b.acquire()      # ya refilleado → no espera
    assert slept == [], "tras refill por tiempo, no debe esperar"


@pytest.mark.asyncio
async def test_average_rate_is_bounded():
    """N acquires sobre bucket sin burst tardan ~ (N-1)/rate en reloj falso."""
    state, now, sleep, _slept = _fake_clock()
    b = AsyncTokenBucket(rate_per_sec=5.0, capacity=1.0, now_fn=now, sleep_fn=sleep)
    for _ in range(6):
        await b.acquire()
    # 1 de burst + 5 esperas de 0.2s = 1.0s total
    assert abs(state["t"] - 1.0) < 1e-9, state["t"]


def test_rate_must_be_positive():
    with pytest.raises(ValueError):
        AsyncTokenBucket(rate_per_sec=0.0, capacity=1.0)


# ---- build_limiter_from_env -------------------------------------------------

def test_disabled_by_default_is_noop():
    assert isinstance(build_limiter_from_env({}), _NoopLimiter)
    assert isinstance(build_limiter_from_env({"LLM_MAX_RPM": "0"}), _NoopLimiter)
    assert isinstance(build_limiter_from_env({"LLM_MAX_RPM": "  "}), _NoopLimiter)
    assert isinstance(build_limiter_from_env({"LLM_MAX_RPM": "abc"}), _NoopLimiter)


def test_enabled_builds_bucket_with_rate():
    lim = build_limiter_from_env({"LLM_MAX_RPM": "120"})
    assert isinstance(lim, AsyncTokenBucket)
    assert abs(lim.rate - 2.0) < 1e-9  # 120/60 = 2/s


@pytest.mark.asyncio
async def test_noop_acquire_never_waits():
    await _NoopLimiter().acquire()  # no debe lanzar ni bloquear


# ---- Integración: generate_structured pasa por el limiter -------------------

class _MiniSchema(BaseModel):
    value: int


def _ok_response(value: int):
    return SimpleNamespace(
        candidates=[SimpleNamespace(
            content=SimpleNamespace(parts=[SimpleNamespace(text=f'{{"value": {value}}}')]),
            finish_reason=SimpleNamespace(name="STOP"),
        )],
        usage_metadata=SimpleNamespace(prompt_token_count=1, candidates_token_count=1, total_token_count=2),
    )


@pytest.mark.asyncio
async def test_generate_structured_acquires_global_rate_limiter(monkeypatch):
    """Cada llamada real al API pasa por `acquire()` del limiter global, ANTES
    de tocar Vertex."""
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-project")
    from src.budget.infrastructure.adapters.ai.gemini_adapter import (
        GoogleGenerativeAIAdapter, _reset_circuit_for_tests,
    )
    _reset_circuit_for_tests()

    order: list[str] = []

    class _SpyLimiter:
        async def acquire(self, tokens: float = 1.0):
            order.append("acquire")

    reset_llm_rate_limiter_for_tests(_SpyLimiter())
    try:
        adapter = GoogleGenerativeAIAdapter(model_name="gemini-2.5-flash", max_retries=2, base_delay=0.0)

        async def _gen(**kwargs):
            order.append("api_call")
            return _ok_response(7)

        adapter.genai_client = SimpleNamespace(
            aio=SimpleNamespace(models=SimpleNamespace(generate_content=_gen))
        )

        result, _ = await adapter.generate_structured(
            system_prompt="s", user_prompt="u", response_schema=_MiniSchema,
        )
        assert result.value == 7
        # acquire ocurrió y ANTES de la llamada al API.
        assert "acquire" in order and "api_call" in order
        assert order.index("acquire") < order.index("api_call")
    finally:
        reset_llm_rate_limiter_for_tests()  # restaura desde env


def test_get_llm_rate_limiter_is_module_singleton():
    a = get_llm_rate_limiter()
    b = get_llm_rate_limiter()
    assert a is b
