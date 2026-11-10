from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal, require_roles
from app.database import get_db
from app.models.entities import Approval, ApprovalStatus, RoleName
from app.schemas.common import ApprovalDecisionRequest, ApprovalOut
from app.services import trust
from app.services import workflows as workflow_service

router = APIRouter(prefix="/api/v1", tags=["approvals"])


def _out(a: Approval) -> ApprovalOut:
    return ApprovalOut(
        id=a.id,
        tenant_id=a.tenant_id,
        workflow_id=a.workflow_id,
        action=a.action,
        resource_type=a.resource_type,
        resource_id=a.resource_id,
        action_fingerprint=a.action_fingerprint,
        status=a.status.value,
        risk=a.risk,
        payload=a.payload or {},
        expires_at=a.expires_at,
        policy_version=a.policy_version,
    )


@router.get("/approvals", response_model=list[ApprovalOut])
async def list_approvals(
    principal: Principal = Depends(get_principal), db: AsyncSession = Depends(get_db)
) -> list[ApprovalOut]:
    result = await db.execute(
        select(Approval)
        .where(Approval.tenant_id == principal.tenant_id)
        .order_by(Approval.created_at.desc())
    )
    return [_out(a) for a in result.scalars().all()]


@router.get("/approvals/{approval_id}", response_model=ApprovalOut)
async def get_approval(
    approval_id: str,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> ApprovalOut:
    result = await db.execute(
        select(Approval).where(
            Approval.id == approval_id, Approval.tenant_id == principal.tenant_id
        )
    )
    approval = result.scalar_one_or_none()
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval not found")
    return _out(approval)


@router.post("/approvals/{approval_id}/approve")
async def approve(
    approval_id: str,
    body: ApprovalDecisionRequest,
    principal: Principal = Depends(require_roles(RoleName.approver, RoleName.admin)),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        approval = await trust.decide_approval(
            db,
            tenant_id=principal.tenant_id,
            approval_id=approval_id,
            approver_user_id=principal.user_id,
            decision="approve",
            reason=body.reason or "approved",
        )
        await db.commit()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    receipt = None
    if approval.action == "campaign_publish":
        try:
            receipt = await workflow_service.execute_sandbox_publish_after_approval(
                db, principal, approval.id
            )
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail=str(exc)) from exc

    return {"approval": _out(approval), "execution": receipt}


@router.post("/approvals/{approval_id}/reject", response_model=ApprovalOut)
async def reject(
    approval_id: str,
    body: ApprovalDecisionRequest,
    principal: Principal = Depends(require_roles(RoleName.approver, RoleName.admin)),
    db: AsyncSession = Depends(get_db),
) -> ApprovalOut:
    try:
        approval = await trust.decide_approval(
            db,
            tenant_id=principal.tenant_id,
            approval_id=approval_id,
            approver_user_id=principal.user_id,
            decision="reject",
            reason=body.reason or "rejected",
        )
        await db.commit()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _out(approval)


# silence unused import warning in some linters
_ = ApprovalStatus
