"""Task execution endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from luxor9.api.deps import get_orchestrator
from luxor9.api.schemas import TaskRequest
from luxor9.core.orchestrator import Orchestrator
from luxor9.shared.enums import TaskStatus
from luxor9.shared.models import Task

router = APIRouter(prefix="/api/v2/tasks", tags=["tasks"])


@router.post("", response_model=Task, status_code=201)
async def submit_task(payload: TaskRequest, orch: Orchestrator = Depends(get_orchestrator)) -> Task:
    """Submit a single task and run the queue to completion."""
    task = payload.to_task()
    await orch.submit_task(task)
    await orch.run()
    return task


@router.get("/{task_id}", response_model=Task)
def get_task(task_id: str, orch: Orchestrator = Depends(get_orchestrator)) -> Task:
    task = orch.queue.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"task {task_id} not found")
    return task


@router.delete("/{task_id}", response_model=Task)
def cancel_task(task_id: str, orch: Orchestrator = Depends(get_orchestrator)) -> Task:
    task = orch.queue.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"task {task_id} not found")
    if task.status in {TaskStatus.PENDING, TaskStatus.READY}:
        task.status = TaskStatus.CANCELLED
    return task
