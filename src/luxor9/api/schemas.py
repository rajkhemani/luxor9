"""Request/response models for the HTTP API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from luxor9.shared.enums import AgentType, Capability
from luxor9.shared.models import Task, new_id


class TaskRequest(BaseModel):
    """Incoming task definition. Provide ``id`` to reference it in dependencies."""

    id: str | None = None
    title: str
    assigned_agent: AgentType | None = None
    required_capability: Capability | None = None
    dependencies: list[str] = Field(default_factory=list)
    is_parallel: bool = True
    input: dict[str, Any] = Field(default_factory=dict)

    def to_task(self) -> Task:
        return Task(
            id=self.id or new_id(),
            title=self.title,
            assigned_agent=self.assigned_agent,
            required_capability=self.required_capability,
            dependencies=self.dependencies,
            is_parallel=self.is_parallel,
            input=self.input,
        )


class OrchestrateRequest(BaseModel):
    tasks: list[TaskRequest]


class OrchestrateResponse(BaseModel):
    workflow_id: str
    results: dict[str, Any]
    tasks: list[Task]


class HealthResponse(BaseModel):
    status: str
    version: str
    agents: int
