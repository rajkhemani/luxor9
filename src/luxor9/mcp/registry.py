"""Model registry, selection strategies, and the MCP router."""

from __future__ import annotations

from typing import Literal

from luxor9.mcp.adapters.mock import MockAdapter
from luxor9.mcp.base import McpPlatformAdapter
from luxor9.shared.enums import McpPlatform
from luxor9.shared.models import CompletionResult, ModelInfo

Strategy = Literal["cost", "speed", "quality", "balanced"]


class ModelRegistry:
    """Aggregates model metadata and selects an optimal model per task."""

    def __init__(self) -> None:
        self._models: dict[str, ModelInfo] = {}

    def register(self, *models: ModelInfo) -> None:
        for model in models:
            self._models[model.id] = model

    def get(self, model_id: str) -> ModelInfo | None:
        return self._models.get(model_id)

    def all(self) -> list[ModelInfo]:
        return list(self._models.values())

    def select(self, strategy: Strategy = "balanced") -> ModelInfo | None:
        """Choose the best registered model for the given optimization strategy."""
        models = self.all()
        if not models:
            return None

        def cost(m: ModelInfo) -> float:
            return m.cost_per_1k if m.cost_per_1k is not None else 1e9

        def latency(m: ModelInfo) -> float:
            return m.latency_ms if m.latency_ms is not None else 1e9

        def quality(m: ModelInfo) -> float:
            return m.quality_score if m.quality_score is not None else 0.0

        if strategy == "cost":
            return min(models, key=cost)
        if strategy == "speed":
            return min(models, key=latency)
        if strategy == "quality":
            return max(models, key=quality)
        # balanced: maximize quality per unit cost (avoid divide-by-zero).
        return max(models, key=lambda m: quality(m) / (cost(m) + 0.001))


class McpRouter:
    """Routes completion + tool calls across platform adapters.

    A ``MockAdapter`` is always registered so the router degrades gracefully to a
    deterministic response when a requested platform is unavailable.
    """

    def __init__(self, fallback_chain: list[McpPlatform] | None = None) -> None:
        self._adapters: dict[McpPlatform, McpPlatformAdapter] = {}
        self.registry = ModelRegistry()
        self.register(MockAdapter())
        # Default order: try Anthropic, then OpenAI, then the deterministic mock.
        self.fallback_chain = fallback_chain or [
            McpPlatform.ANTHROPIC,
            McpPlatform.OPENAI,
            McpPlatform.MOCK,
        ]

    def register(self, adapter: McpPlatformAdapter) -> None:
        self._adapters[adapter.platform] = adapter

    def get(self, platform: McpPlatform) -> McpPlatformAdapter | None:
        return self._adapters.get(platform)

    def available_platforms(self) -> list[McpPlatform]:
        return list(self._adapters)

    async def refresh_models(self) -> None:
        """Pull model metadata from every registered adapter into the registry."""
        for adapter in self._adapters.values():
            try:
                self.registry.register(*await adapter.list_models())
            except Exception:  # noqa: BLE001 - a flaky adapter must not break discovery
                continue

    async def complete(
        self,
        prompt: str,
        *,
        platform: McpPlatform | None = None,
        model: str | None = None,
        system: str | None = None,
        max_tokens: int = 1024,
    ) -> CompletionResult:
        """Complete ``prompt`` on ``platform``, or walk the fallback chain.

        Each candidate adapter is tried in order; the first to succeed wins. The
        chain always ends at the mock adapter, so this never raises for an
        unavailable platform.
        """
        order = [platform] if platform else list(self.fallback_chain)
        last_error: Exception | None = None
        for candidate in order:
            adapter = self._adapters.get(candidate)
            if adapter is None:
                continue
            try:
                return await adapter.complete(
                    prompt, model=model, system=system, max_tokens=max_tokens
                )
            except Exception as exc:  # noqa: BLE001 - fall through to the next adapter
                last_error = exc
                continue
        if last_error is not None:
            raise last_error
        raise RuntimeError("No MCP adapter available to handle the request")
