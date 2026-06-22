"""Portable Pydantic domain models for tasks, agents, MCP, events, and audit."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field

from luxor9.shared.enums import (
    AgentStatus,
    AgentType,
    Capability,
    EventType,
    McpPlatform,
    TaskStatus,
)


def utcnow() -> datetime:
    return datetime.now(UTC)


def new_id() -> str:
    return str(uuid.uuid4())


class ResourceLimits(BaseModel):
    """Per-agent execution guardrails."""

    max_concurrent_tasks: int = 4
    timeout_seconds: float = 120.0
    max_retries: int = 0


class Task(BaseModel):
    """A portable unit of work routed to an agent.

    A task targets either a concrete ``assigned_agent`` or, when that is unset,
    any agent advertising ``required_capability``.
    """

    id: str = Field(default_factory=new_id)
    title: str
    assigned_agent: AgentType | None = None
    required_capability: Capability | None = None
    dependencies: list[str] = Field(default_factory=list)
    is_parallel: bool = True
    status: TaskStatus = TaskStatus.PENDING
    input: dict[str, Any] = Field(default_factory=dict)
    result: Any | None = None
    error: str | None = None
    parent_task: str | None = None
    execution_time_ms: int | None = None
    created_at: datetime = Field(default_factory=utcnow)
    started_at: datetime | None = None
    completed_at: datetime | None = None


class ModelInfo(BaseModel):
    """Performance + cost metadata for a single model in the registry."""

    id: str
    platform: McpPlatform
    context_window: int = 8192
    rate_limit: int | None = None  # requests/min
    cost_per_1k: float | None = None  # blended USD per 1k tokens
    latency_ms: int | None = None
    quality_score: float | None = None  # 0..1
    local: bool = False


class McpTool(BaseModel):
    name: str
    description: str = ""
    input_schema: dict[str, Any] = Field(default_factory=dict)


class McpResource(BaseModel):
    uri: str
    name: str = ""
    mime_type: str = "text/plain"


class McpCallToolResult(BaseModel):
    tool: str
    content: Any = None
    is_error: bool = False
    raw: dict[str, Any] | None = None


class CompletionResult(BaseModel):
    """Normalized text-generation result returned by every MCP adapter."""

    text: str
    model: str
    platform: McpPlatform
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: int = 0


class Event(BaseModel):
    id: str = Field(default_factory=new_id)
    type: EventType
    payload: dict[str, Any] = Field(default_factory=dict)
    actor: str | None = None
    timestamp: datetime = Field(default_factory=utcnow)


class AuditRecord(BaseModel):
    """Append-only audit-trail entry."""

    id: str = Field(default_factory=new_id)
    actor: str | None = None
    action: str
    resource_type: str
    resource_id: str | None = None
    delta: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=utcnow)


class AgentInfo(BaseModel):
    """Serializable snapshot of an agent for discovery + dashboards."""

    type: AgentType
    capabilities: list[Capability]
    status: AgentStatus
    current_task_id: str | None = None
    description: str = ""
    resource_limits: ResourceLimits = Field(default_factory=ResourceLimits)
