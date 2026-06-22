"""Agent management endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from luxor9.api.deps import get_orchestrator
from luxor9.core.orchestrator import Orchestrator
from luxor9.shared.enums import AgentStatus, AgentType
from luxor9.shared.models import AgentInfo

router = APIRouter(prefix="/api/v2/agents", tags=["agents"])


@router.get("", response_model=list[AgentInfo])
def list_agents(orch: Orchestrator = Depends(get_orchestrator)) -> list[AgentInfo]:
    return orch.registry.directory()


@router.get("/{agent_type}/health")
async def agent_health(
    agent_type: AgentType, orch: Orchestrator = Depends(get_orchestrator)
) -> dict[str, Any]:
    agent = orch.registry.get(agent_type)
    if agent is None:
        raise HTTPException(status_code=404, detail=f"agent {agent_type.value} not registered")
    return await agent.health_check()


@router.patch("/{agent_type}/pause", response_model=AgentInfo)
def pause_agent(agent_type: AgentType, orch: Orchestrator = Depends(get_orchestrator)) -> AgentInfo:
    agent = orch.registry.get(agent_type)
    if agent is None:
        raise HTTPException(status_code=404, detail=f"agent {agent_type.value} not registered")
    agent.status = AgentStatus.PAUSED
    return agent.info()
