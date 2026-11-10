from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal, require_roles
from app.database import get_db
from app.models.entities import RoleName
from app.schemas.common import (
    BlueprintDecisionRequest,
    OverviewResponse,
    WorkflowCreateRequest,
    WorkflowOut,
)
from app.services import workflows as workflow_service

router = APIRouter(prefix="/api/v1", tags=["workflows"])


@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    principal: Principal = Depends(get_principal), db: AsyncSession = Depends(get_db)
) -> OverviewResponse:
    data = await workflow_service.overview(db, principal.tenant_id)
    return OverviewResponse(**data)


@router.post("/workflows", response_model=WorkflowOut)
async def create_workflow(
    body: WorkflowCreateRequest,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> WorkflowOut:
    wf = await workflow_service.create_workflow_with_blueprint(
        db, principal, body.objective, body.context, body.pack
    )
    return WorkflowOut(**workflow_service.workflow_to_dict(wf))


@router.get("/workflows", response_model=list[WorkflowOut])
async def list_workflows(
    principal: Principal = Depends(get_principal), db: AsyncSession = Depends(get_db)
) -> list[WorkflowOut]:
    items = await workflow_service.list_workflows(db, principal.tenant_id)
    return [WorkflowOut(**workflow_service.workflow_to_dict(w)) for w in items]


@router.get("/workflows/{workflow_id}", response_model=WorkflowOut)
async def get_workflow(
    workflow_id: str,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> WorkflowOut:
    wf = await workflow_service.get_workflow(db, principal.tenant_id, workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowOut(**workflow_service.workflow_to_dict(wf))


@router.post("/workflows/{workflow_id}/blueprint/decision", response_model=WorkflowOut)
async def blueprint_decision(
    workflow_id: str,
    body: BlueprintDecisionRequest,
    principal: Principal = Depends(require_roles(RoleName.approver, RoleName.admin)),
    db: AsyncSession = Depends(get_db),
) -> WorkflowOut:
    try:
        wf = await workflow_service.decide_blueprint(
            db, principal, workflow_id, body.decision, body.reason
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return WorkflowOut(**workflow_service.workflow_to_dict(wf))
