"""OpenAI adapter.

The ``openai`` SDK is an optional dependency (``pip install luxor9[openai]``).
"""

from __future__ import annotations

import os
import time
from typing import Any

from luxor9.mcp.base import McpPlatformAdapter
from luxor9.shared.enums import McpPlatform
from luxor9.shared.models import CompletionResult, ModelInfo

DEFAULT_MODEL = "gpt-4o"

_MODELS = [
    ModelInfo(
        id="gpt-4o",
        platform=McpPlatform.OPENAI,
        context_window=128_000,
        rate_limit=10_000,
        cost_per_1k=0.03,
        quality_score=0.95,
    ),
    ModelInfo(
        id="gpt-4o-mini",
        platform=McpPlatform.OPENAI,
        context_window=128_000,
        cost_per_1k=0.001,
        quality_score=0.82,
    ),
]


class OpenAIAdapter(McpPlatformAdapter):
    platform = McpPlatform.OPENAI

    def __init__(self, api_key: str | None = None, default_model: str = DEFAULT_MODEL) -> None:
        self._api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self._default_model = default_model
        self._client: Any = None

    async def authenticate(self) -> None:
        if not self._api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:  # pragma: no cover - exercised only without the extra
            raise RuntimeError("openai SDK not installed; `pip install luxor9[openai]`") from exc
        self._client = AsyncOpenAI(api_key=self._api_key)

    async def list_models(self) -> list[ModelInfo]:
        return list(_MODELS)

    async def complete(
        self,
        prompt: str,
        *,
        model: str | None = None,
        system: str | None = None,
        max_tokens: int = 1024,
        **kwargs: Any,
    ) -> CompletionResult:
        if self._client is None:
            await self.authenticate()
        model = model or self._default_model
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        started = time.perf_counter()
        response = await self._client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            messages=messages,
        )
        latency_ms = int((time.perf_counter() - started) * 1000)
        usage = response.usage
        return CompletionResult(
            text=response.choices[0].message.content or "",
            model=model,
            platform=self.platform,
            prompt_tokens=getattr(usage, "prompt_tokens", 0),
            completion_tokens=getattr(usage, "completion_tokens", 0),
            latency_ms=latency_ms,
        )
