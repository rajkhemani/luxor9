"""Abstract adapter every LLM platform implements.

Adapters normalize each vendor's SDK to a single surface: ``list_models`` for
discovery, ``complete`` for text generation, and optional ``call_tool`` /
``get_resources`` for MCP tool + resource access.
"""

from __future__ import annotations

import abc
from typing import Any

from luxor9.shared.enums import McpPlatform
from luxor9.shared.models import (
    CompletionResult,
    McpCallToolResult,
    McpResource,
    McpTool,
    ModelInfo,
)


class McpPlatformAdapter(abc.ABC):
    """One adapter per supported platform (Anthropic, OpenAI, ...)."""

    platform: McpPlatform

    @abc.abstractmethod
    async def authenticate(self) -> None:
        """Validate credentials / warm a client. Raise on misconfiguration."""

    @abc.abstractmethod
    async def list_models(self) -> list[ModelInfo]:
        """Return the models this adapter can route to."""

    @abc.abstractmethod
    async def complete(
        self,
        prompt: str,
        *,
        model: str | None = None,
        system: str | None = None,
        max_tokens: int = 1024,
        **kwargs: Any,
    ) -> CompletionResult:
        """Generate text for ``prompt`` and return a normalized result."""

    async def call_tool(self, tool: McpTool, params: dict[str, Any]) -> McpCallToolResult:
        raise NotImplementedError(f"{self.platform.value} does not support tool calls")

    async def get_resources(self) -> list[McpResource]:
        return []

    @property
    def name(self) -> str:
        return self.platform.value
