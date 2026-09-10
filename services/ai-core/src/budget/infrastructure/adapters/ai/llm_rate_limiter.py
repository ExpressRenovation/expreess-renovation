"""Rate-limiter GLOBAL para las llamadas LLM (token-bucket asíncrono).

`gemini-2.5-flash` en Vertex usa Dynamic Shared Quota (DSQ): un pool por región
que devuelve 429 bajo ráfaga y que NO se puede subir a mano. `SWARM_CONCURRENCY`
solo estrangula la fase de pricing; la extracción, la deconstrucción y el
compositor `from_scratch` también disparan Flash y queman el mismo pool. Este
módulo pone un techo por-minuto GLOBAL sobre TODAS las llamadas Flash, en el
único chokepoint por el que pasan: `GoogleGenerativeAIAdapter.generate_structured`
hace `await get_llm_rate_limiter().acquire()` antes de cada llamada al API.

- Singleton a nivel de módulo (una ejecución de Cloud Run Job = un proceso = un
  budget → el ámbito por-proceso es el correcto; no es distribuido).
- Configurable por env `LLM_MAX_RPM` (peticiones/minuto). Ausente o ≤0 →
  `_NoopLimiter` (sin throttle, comportamiento actual). Se enciende y se tunea
  por env sin rebuild.
- `LLM_RATE_BURST` (opcional) = capacidad del bucket (default = min(RPM, 20)).
- `now_fn`/`sleep_fn` inyectables para tests deterministas.
"""
from __future__ import annotations

import asyncio
import os
import time
from typing import Awaitable, Callable, Mapping, Optional, Union


class AsyncTokenBucket:
    """Token-bucket asíncrono. `acquire()` bloquea (async) hasta haber token.

    Ritmo medio = `rate_per_sec`; permite ráfagas hasta `capacity`. El lock
    serializa a los waiters, así que N tareas concurrentes progresan al ritmo.
    """

    def __init__(
        self,
        rate_per_sec: float,
        capacity: float,
        *,
        now_fn: Callable[[], float] = time.monotonic,
        sleep_fn: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ) -> None:
        if rate_per_sec <= 0:
            raise ValueError("rate_per_sec debe ser > 0")
        if capacity <= 0:
            raise ValueError("capacity debe ser > 0")
        self.rate = float(rate_per_sec)
        self.capacity = float(capacity)
        self._tokens = float(capacity)
        self._now = now_fn
        self._sleep = sleep_fn
        self._last = now_fn()
        self._lock = asyncio.Lock()

    def _refill(self) -> None:
        now = self._now()
        elapsed = now - self._last
        if elapsed > 0:
            self._tokens = min(self.capacity, self._tokens + elapsed * self.rate)
            self._last = now

    async def acquire(self, tokens: float = 1.0) -> None:
        async with self._lock:
            while True:
                self._refill()
                if self._tokens >= tokens:
                    self._tokens -= tokens
                    return
                deficit = tokens - self._tokens
                await self._sleep(deficit / self.rate)


class _NoopLimiter:
    """Limiter deshabilitado: `acquire()` no espera nunca (comportamiento actual)."""

    async def acquire(self, tokens: float = 1.0) -> None:
        return


LimiterT = Union[AsyncTokenBucket, _NoopLimiter]


def _read_float(env: Mapping[str, str], key: str) -> Optional[float]:
    raw = (env.get(key) or "").strip()
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def build_limiter_from_env(env: Optional[Mapping[str, str]] = None) -> LimiterT:
    """Construye el limiter desde env. `LLM_MAX_RPM` ausente/≤0/inválido → NoOp."""
    env = env if env is not None else os.environ
    rpm = _read_float(env, "LLM_MAX_RPM")
    if rpm is None or rpm <= 0:
        return _NoopLimiter()
    rate_per_sec = rpm / 60.0
    burst = _read_float(env, "LLM_RATE_BURST")
    if burst is None or burst <= 0:
        burst = max(1.0, min(rpm, 20.0))
    return AsyncTokenBucket(rate_per_sec, burst)


_limiter: LimiterT = build_limiter_from_env()


def get_llm_rate_limiter() -> LimiterT:
    """Devuelve el limiter global (singleton de módulo)."""
    return _limiter


def reset_llm_rate_limiter_for_tests(limiter: Optional[LimiterT] = None) -> None:
    """Reemplaza el singleton (tests). Sin argumento → re-lee del env."""
    global _limiter
    _limiter = limiter if limiter is not None else build_limiter_from_env()
