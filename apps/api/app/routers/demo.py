"""GTM demo helpers — synthetic only, gated to development."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal
from app.config import get_settings
from app.database import get_db
from app.schemas.common import WorkflowOut
from app.services import workflows as workflow_service

router = APIRouter(prefix="/api/v1/demo", tags=["demo"])


@router.post("/seed", response_model=WorkflowOut)
async def seed_demo_workflow(
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> WorkflowOut:
    settings = get_settings()
    if settings.environment == "production" and not settings.auth_disabled_for_tests:
        raise HTTPException(status_code=403, detail="Demo seed disabled in production")

    wf = await workflow_service.create_workflow_with_blueprint(
        db,
        principal,
        objective=(
            "Market-to-launch intelligence for a Dubai Creek Harbour residential tower "
            "(GTM demo brief)"
        ),
        context={
            "location": "Dubai",
            "product_type": "residential",
            "segment": "HNW GCC + South Asia",
            "price_band": "AED 2.5M–6M",
            "horizon": "Q2 launch",
            "demo": True,
        },
        pack="cmo_re",
    )
    return WorkflowOut(**workflow_service.workflow_to_dict(wf))


@router.post("/run", response_model=WorkflowOut)
async def seed_and_run_demo(
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> WorkflowOut:
    """Seed blueprint then auto-approve + execute for live pitch demos."""
    settings = get_settings()
    if settings.environment == "production" and not settings.auth_disabled_for_tests:
        raise HTTPException(status_code=403, detail="Demo run disabled in production")
    if principal.role.value not in {"admin", "approver"}:
        raise HTTPException(status_code=403, detail="Approver role required")

    seeded = await seed_demo_workflow(principal, db)
    wf = await workflow_service.decide_blueprint(
        db, principal, seeded.id, "approve", "gtm demo auto-approve"
    )
    return WorkflowOut(**workflow_service.workflow_to_dict(wf))
