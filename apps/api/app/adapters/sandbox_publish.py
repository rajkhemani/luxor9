from __future__ import annotations

import uuid
from datetime import datetime, timezone


async def sandbox_campaign_publish(*, tenant_id: str, workflow_id: str, payload: dict) -> dict:
    """Records intent only — never contacts a real ad network."""
    return {
        "provider": "sandbox",
        "status": "accepted",
        "receipt_id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "workflow_id": workflow_id,
        "payload_echo": payload,
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "note": "Sandbox adapter — no external side effect",
    }
