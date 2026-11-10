from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal
from app.database import get_db
from app.schemas.common import TrustEvaluateRequest, TrustEvaluateResponse
from app.services import trust as trust_service

router = APIRouter(prefix="/api/v1", tags=["trust"])


@router.post("/trust/evaluate", response_model=TrustEvaluateResponse)
async def evaluate(
    body: TrustEvaluateRequest,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> TrustEvaluateResponse:
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
