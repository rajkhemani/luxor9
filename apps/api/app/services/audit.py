from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import AuditEvent


async def emit_audit(
    db: AsyncSession,
    *,
    tenant_id: str,
    actor_id: str,
    event_type: str,
    resource_type: str = "",
    resource_id: str = "",
    correlation_id: str = "",
    payload: dict | None = None,
    actor_type: str = "user",
) -> AuditEvent:
    event = AuditEvent(
        tenant_id=tenant_id,
        actor_id=actor_id,
        actor_type=actor_type,
        event_type=event_type,
        resource_type=resource_type,
        resource_id=resource_id,
        correlation_id=correlation_id,
        payload=payload or {},
    )
    db.add(event)
    await db.flush()
    return event
