"""Deterministic, dependency-free adapter.

Lets the whole platform run — and the test suite pass — with no API keys and no
network. It is also the default terminal fallback in :class:`McpRouter`.
"""

from __future__ import annotations

from typing import Any

from luxor9.mcp.base import McpPlatformAdapter
from luxor9.shared.enums import McpPlatform
from luxor9.shared.models import CompletionResult, ModelInfo


class MockAdapter(McpPlatformAdapter):
    platform = McpPlatform.MOCK

    def __init__(self, models: list[ModelInfo] | None = None) -> None:
        self._models = models or [
            ModelInfo(
                id="mock-1",
                platform=McpPlatform.MOCK,
                context_window=8192,
                cost_per_1k=0.0,
                latency_ms=1,
                quality_score=0.5,
                local=True,
            )
        ]

    async def authenticate(self) -> None:
        return None

    async def list_models(self) -> list[ModelInfo]:
        return list(self._models)

    async def complete(
        self,
        prompt: str,
        *,
        model: str | None = None,
        system: str | None = None,
        max_tokens: int = 1024,
        **kwargs: Any,
    ) -> CompletionResult:
        model = model or self._models[0].id
        first_line = next((ln for ln in prompt.strip().splitlines() if ln.strip()), "")
        text = f"[mock:{model}] {first_line[:200]}".strip()
        return CompletionResult(
            text=text,
            model=model,
            platform=self.platform,
            prompt_tokens=len(prompt.split()),
            completion_tokens=len(text.split()),
            latency_ms=1,
        )
