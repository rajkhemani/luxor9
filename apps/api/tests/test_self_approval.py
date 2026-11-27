from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import Base
from app.models.entities import Approval, ApprovalStatus
from app.services.trust import decide_approval


@pytest.mark.asyncio
async def test_self_approval_forbidden():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as db:
        approval = Approval(
            tenant_id="t1",
            workflow_id="w1",
            principal_id="user-same",
            action="campaign_publish",
            resource_type="campaign",
            resource_id="c1",
            action_fingerprint="abc",
            policy_version="v1",
            payload={},
            status=ApprovalStatus.pending,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(approval)
        await db.commit()
        await db.refresh(approval)
        with pytest.raises(ValueError, match="self_approval_forbidden"):
            await decide_approval(
                db,
                tenant_id="t1",
                approval_id=approval.id,
                approver_user_id="user-same",
                decision="approve",
            )
    await engine.dispose()
