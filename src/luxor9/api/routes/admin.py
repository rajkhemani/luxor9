"""Admin / observability endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from luxor9.api.deps import get_orchestrator
from luxor9.core.orchestrator import Orchestrator
from luxor9.shared.models import AuditRecord

router = APIRouter(prefix="/api/v2/admin", tags=["admin"])


@router.get("/dashboard")
def dashboard(orch: Orchestrator = Depends(get_orchestrator)) -> dict[str, Any]:
    """System metrics: agent utilization, task throughput, and event counts."""
    agents = orch.registry.all()
    agent_status: dict[str, int] = {}
    for agent in agents:
        key = agent.status.value
        agent_status[key] = agent_status.get(key, 0) + 1

    task_status: dict[str, int] = {}
    for task in orch.queue.all():
        key = task.status.value
        task_status[key] = task_status.get(key, 0) + 1

    return {
        "agents": {"total": len(agents), "by_status": agent_status},
        "tasks": {"total": len(orch.queue), "by_status": task_status},
        "models": len(orch.router.registry.all()),
        "platforms": [p.value for p in orch.router.available_platforms()],
        "events": orch.state.snapshot(),
        "audit_records": len(orch.audit),
    }


@router.get("/audit", response_model=list[AuditRecord])
def audit_log(orch: Orchestrator = Depends(get_orchestrator)) -> list[AuditRecord]:
    return orch.audit.all()
