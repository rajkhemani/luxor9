"""Anthropic (Claude) adapter.

The ``anthropic`` SDK is an optional dependency (``pip install luxor9[anthropic]``).
Imports are deferred so the rest of the platform runs without it.
"""

from __future__ import annotations

import os
import time
from typing import Any

from luxor9.mcp.base import McpPlatformAdapter
from luxor9.shared.enums import McpPlatform
from luxor9.shared.models import CompletionResult, ModelInfo

# Default to the latest, most capable Claude model.
DEFAULT_MODEL = "claude-opus-4-8"

# Static registry metadata; pricing is blended USD per 1k tokens.
_MODELS = [
    ModelInfo(
        id="claude-opus-4-8",
        platform=McpPlatform.ANTHROPIC,
        context_window=1_000_000,
        cost_per_1k=0.015,
        quality_score=0.98,
    ),
    ModelInfo(
        id="claude-sonnet-4-6",
        platform=McpPlatform.ANTHROPIC,
        context_window=1_000_000,
        cost_per_1k=0.009,
        quality_score=0.9,
    ),
    ModelInfo(
        id="claude-haiku-4-5",
        platform=McpPlatform.ANTHROPIC,
        context_window=200_000,
        cost_per_1k=0.003,
        quality_score=0.8,
    ),
]


class AnthropicAdapter(McpPlatformAdapter):
    platform = McpPlatform.ANTHROPIC

    def __init__(self, api_key: str | None = None, default_model: str = DEFAULT_MODEL) -> None:
        self._api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self._default_model = default_model
        self._client: Any = None

    async def authenticate(self) -> None:
        if not self._api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        try:
            from anthropic import AsyncAnthropic
        except ImportError as exc:  # pragma: no cover - exercised only without the extra
            raise RuntimeError(
                "anthropic SDK not installed; `pip install luxor9[anthropic]`"
            ) from exc
        self._client = AsyncAnthropic(api_key=self._api_key)

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
        started = time.perf_counter()
        message = await self._client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system or "You are a helpful agent in the LUXOR9 platform.",
            messages=[{"role": "user", "content": prompt}],
        )
        latency_ms = int((time.perf_counter() - started) * 1000)
        text = "".join(block.text for block in message.content if block.type == "text")
        return CompletionResult(
            text=text,
            model=model,
            platform=self.platform,
            prompt_tokens=message.usage.input_tokens,
            completion_tokens=message.usage.output_tokens,
            latency_ms=latency_ms,
        )
