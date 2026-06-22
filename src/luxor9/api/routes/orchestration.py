"""Multi-agent workflow orchestration endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from luxor9.api.deps import get_orchestrator
from luxor9.api.schemas import OrchestrateRequest, OrchestrateResponse
from luxor9.core.orchestrator import Orchestrator
from luxor9.core.task_queue import TaskQueueError
from luxor9.shared.models import new_id

router = APIRouter(prefix="/api/v2/orchestrate", tags=["orchestration"])


@router.post("", response_model=OrchestrateResponse)
async def orchestrate(
    payload: OrchestrateRequest, orch: Orchestrator = Depends(get_orchestrator)
) -> OrchestrateResponse:
    """Submit a DAG of tasks and run it to completion."""
    tasks = [req.to_task() for req in payload.tasks]
    workflow_id = new_id()
    try:
        results = await orch.orchestrate(tasks, workflow_id=workflow_id)
    except TaskQueueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return OrchestrateResponse(workflow_id=workflow_id, results=results, tasks=tasks)


@router.get("/{workflow_id}", response_model=OrchestrateResponse)
def get_workflow(
    workflow_id: str, orch: Orchestrator = Depends(get_orchestrator)
) -> OrchestrateResponse:
    task_ids = orch.workflows.get(workflow_id)
    if task_ids is None:
        raise HTTPException(status_code=404, detail=f"workflow {workflow_id} not found")
    tasks = [t for t in (orch.queue.get(tid) for tid in task_ids) if t is not None]
    results = {t.id: t.result for t in tasks if t.result is not None}
    return OrchestrateResponse(workflow_id=workflow_id, results=results, tasks=tasks)
