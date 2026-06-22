"""MCP layer: mock adapter, router fallback, and model selection."""

from luxor9.mcp.adapters.mock import MockAdapter
from luxor9.mcp.registry import McpRouter, ModelRegistry
from luxor9.shared.enums import McpPlatform
from luxor9.shared.models import ModelInfo


async def test_mock_adapter_is_deterministic():
    adapter = MockAdapter()
    a = await adapter.complete("hello world")
    b = await adapter.complete("hello world")
    assert a.text == b.text
    assert a.platform == McpPlatform.MOCK


async def test_router_falls_back_to_mock_for_unavailable_platform():
    router = McpRouter()
    # Anthropic is in the fallback chain but not registered -> mock answers.
    result = await router.complete("ping", platform=None)
    assert result.platform == McpPlatform.MOCK


async def test_router_explicit_unknown_platform_still_resolves_via_chain():
    router = McpRouter()
    result = await router.complete("ping")
    assert result.text.startswith("[mock:")


def test_model_registry_strategies():
    registry = ModelRegistry()
    registry.register(
        ModelInfo(
            id="cheap",
            platform=McpPlatform.MOCK,
            cost_per_1k=0.001,
            quality_score=0.6,
            latency_ms=50,
        ),
        ModelInfo(
            id="smart",
            platform=McpPlatform.ANTHROPIC,
            cost_per_1k=0.02,
            quality_score=0.98,
            latency_ms=400,
        ),
        ModelInfo(
            id="fast",
            platform=McpPlatform.OPENAI,
            cost_per_1k=0.01,
            quality_score=0.8,
            latency_ms=10,
        ),
    )
    assert registry.select("cost").id == "cheap"
    assert registry.select("quality").id == "smart"
    assert registry.select("speed").id == "fast"
    assert registry.select("balanced") is not None
