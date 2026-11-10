from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import MeteringEvent


async def emit_metering(
    db: AsyncSession,
    *,
    tenant_id: str,
    event_name: str,
    workflow_id: str | None = None,
    units: int = 1,
    meta: dict | None = None,
) -> MeteringEvent:
    event = MeteringEvent(
        tenant_id=tenant_id,
        event_name=event_name,
        workflow_id=workflow_id,
        units=units,
        meta=meta or {},
    )
    db.add(event)
    await db.flush()
    return event
