"""Factory for the default 12-agent roster."""

from __future__ import annotations

from luxor9.agents.base import AgentBase
from luxor9.agents.specialized import ALL_AGENT_CLASSES


def build_default_agents() -> list[AgentBase]:
    """Instantiate one of each of the 12 specialized agents."""
    return [cls() for cls in ALL_AGENT_CLASSES]
