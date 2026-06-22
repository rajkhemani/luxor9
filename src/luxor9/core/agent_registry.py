"""Agent registry with capability-based discovery."""

from __future__ import annotations

from luxor9.agents.base import AgentBase
from luxor9.shared.enums import AgentType, Capability
from luxor9.shared.models import AgentInfo, Task


class AgentRegistry:
    """Holds live agent instances and resolves them by type or capability."""

    def __init__(self) -> None:
        self._agents: dict[AgentType, AgentBase] = {}

    def register(self, agent: AgentBase) -> None:
        self._agents[agent.agent_type] = agent

    def get(self, agent_type: AgentType) -> AgentBase | None:
        return self._agents.get(agent_type)

    def all(self) -> list[AgentBase]:
        return list(self._agents.values())

    def by_capability(self, capability: Capability) -> list[AgentBase]:
        return [a for a in self._agents.values() if a.can_handle(capability)]

    def discover(self, capability: Capability) -> AgentBase | None:
        """Return the first agent advertising ``capability`` (or ``None``)."""
        matches = self.by_capability(capability)
        return matches[0] if matches else None

    def find_for_task(self, task: Task) -> AgentBase | None:
        """Resolve the agent for a task: explicit assignment wins, else capability."""
        if task.assigned_agent is not None:
            return self.get(task.assigned_agent)
        if task.required_capability is not None:
            return self.discover(task.required_capability)
        return None

    def directory(self) -> list[AgentInfo]:
        return [agent.info() for agent in self._agents.values()]

    def __len__(self) -> int:
        return len(self._agents)
