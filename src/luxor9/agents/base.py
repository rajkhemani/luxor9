"""Standardized agent interface shared by all 12 LUXOR9 agents."""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
from typing import Any

from luxor9.mcp.registry import McpRouter
from luxor9.shared.enums import AgentStatus, AgentType, Capability
from luxor9.shared.models import AgentInfo, ResourceLimits, Task


@dataclass
class ExecutionContext:
    """Everything an agent needs to run a task.

    ``dependencies`` maps each completed dependency task id to its result, so an
    agent can consume upstream output without reaching back into the queue.
    """

    task: Task
    router: McpRouter
    dependencies: dict[str, Any] = field(default_factory=dict)

    async def complete(self, prompt: str, *, system: str | None = None, **kwargs: Any) -> str:
        """Convenience wrapper around the MCP router returning just the text."""
        result = await self.router.complete(prompt, system=system, **kwargs)
        return result.text


class AgentBase(abc.ABC):
    """Base class establishing the agent contract.

    Subclasses set ``agent_type`` and ``capabilities`` and implement
    :meth:`execute`. Status bookkeeping is handled here.
    """

    agent_type: AgentType
    capabilities: list[Capability] = []
    description: str = ""

    def __init__(self, resource_limits: ResourceLimits | None = None) -> None:
        self.resource_limits = resource_limits or ResourceLimits()
        self.status: AgentStatus = AgentStatus.IDLE
        self.current_task_id: str | None = None

    @abc.abstractmethod
    async def execute(self, context: ExecutionContext) -> Any:
        """Perform the task described by ``context.task`` and return a result."""

    def can_handle(self, capability: Capability) -> bool:
        return capability in self.capabilities

    async def health_check(self) -> dict[str, Any]:
        return {
            "type": self.agent_type.value,
            "status": self.status.value,
            "current_task_id": self.current_task_id,
            "capabilities": [c.value for c in self.capabilities],
        }

    def info(self) -> AgentInfo:
        return AgentInfo(
            type=self.agent_type,
            capabilities=list(self.capabilities),
            status=self.status,
            current_task_id=self.current_task_id,
            description=self.description,
            resource_limits=self.resource_limits,
        )
