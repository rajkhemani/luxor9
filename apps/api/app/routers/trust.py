from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal
from app.database import get_db
from app.models.entities import Workflow, WorkflowStatus
from app.schemas.common import TrustEvaluateRequest, TrustEvaluateResponse
from app.services import trust as trust_service

router = APIRouter(prefix="/api/v1", tags=["trust"])

_ACTIONABLE = {
    WorkflowStatus.running,
    WorkflowStatus.awaiting_action_approval,
    WorkflowStatus.awaiting_blueprint_approval,
    WorkflowStatus.draft,
    WorkflowStatus.completed,
}


@router.post("/trust/evaluate", response_model=TrustEvaluateResponse)
async def evaluate(
    body: TrustEvaluateRequest,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> TrustEvaluateResponse:
    wf = (
        await db.execute(
            select(Workflow).where(
                Workflow.id == body.workflow_id, Workflow.tenant_id == principal.tenant_id
            )
        )
    ).scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if wf.status not in _ACTIONABLE:
        raise HTTPException(status_code=400, detail=f"Workflow status {wf.status.value} is not actionable")

    result = await trust_service.evaluate(
        db,
        tenant_id=principal.tenant_id,
        principal_id=principal.user_id,
        principal_type="user",
        workflow_id=body.workflow_id,
        action=body.action,
        resource_type=body.resource_type,
        resource_id=body.resource_id,
        payload=body.payload,
        correlation_id=body.correlation_id,
    )
    await db.commit()
    return TrustEvaluateResponse(
        decision=result["decision"],
        reason_codes=result["reason_codes"],
        policy_version=result["policy_version"],
        approval_id=result["approval_id"],
        expires_at=result["expires_at"],
    )
