from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal
from app.database import get_db
from app.models.entities import AuditEvent, MeteringEvent
from app.schemas.common import AuditEventOut, MeteringEventOut

router = APIRouter(prefix="/api/v1", tags=["audit"])


@router.get("/audit", response_model=list[AuditEventOut])
async def list_audit(
    principal: Principal = Depends(get_principal), db: AsyncSession = Depends(get_db)
) -> list[AuditEventOut]:
    rows = (
        await db.execute(
            select(AuditEvent)
            .where(AuditEvent.tenant_id == principal.tenant_id)
            .order_by(AuditEvent.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    return [
        AuditEventOut(
            id=r.id,
            event_type=r.event_type,
            actor_id=r.actor_id,
            resource_type=r.resource_type,
            resource_id=r.resource_id,
            payload=r.payload or {},
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/metering", response_model=list[MeteringEventOut])
async def list_metering(
    principal: Principal = Depends(get_principal), db: AsyncSession = Depends(get_db)
) -> list[MeteringEventOut]:
    rows = (
        await db.execute(
            select(MeteringEvent)
            .where(MeteringEvent.tenant_id == principal.tenant_id)
            .order_by(MeteringEvent.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    return [
        MeteringEventOut(
            id=r.id,
            event_name=r.event_name,
            workflow_id=r.workflow_id,
            units=r.units,
            meta=r.meta or {},
            created_at=r.created_at,
        )
        for r in rows
    ]
