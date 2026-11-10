from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import Base
from app.models.entities import Approval, ApprovalStatus
from app.services.trust import fingerprint_action, recheck_before_execution


@pytest.mark.asyncio
async def test_fingerprint_changes_with_payload():
    a = fingerprint_action("campaign_publish", "campaign", "c1", {"headline": "A"})
    b = fingerprint_action("campaign_publish", "campaign", "c1", {"headline": "B"})
    assert a != b


@pytest.mark.asyncio
async def test_auto_allow_research(client):
    wf = await client.post(
        "/api/v1/workflows",
        json={"objective": "Research Dubai marina demand"},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    wf_id = wf.json()["id"]
    res = await client.post(
        "/api/v1/trust/evaluate",
        json={
            "workflow_id": wf_id,
            "action": "public_research",
            "resource_type": "web",
            "resource_id": "src-1",
            "payload": {},
        },
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert res.status_code == 200
    assert res.json()["decision"] == "ALLOW"


@pytest.mark.asyncio
async def test_campaign_publish_requires_approval(client):
    wf = await client.post(
        "/api/v1/workflows",
        json={"objective": "Launch campaign for creek harbour"},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    wf_id = wf.json()["id"]
    res = await client.post(
        "/api/v1/trust/evaluate",
        json={
            "workflow_id": wf_id,
            "action": "campaign_publish",
            "resource_type": "campaign",
            "resource_id": "draft-1",
            "payload": {"channel": "sandbox", "headline": "Hello"},
        },
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["decision"] == "REQUIRES_APPROVAL"
    assert body["approval_id"]


@pytest.mark.asyncio
async def test_recheck_rejects_payload_tamper():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as db:
        fp = fingerprint_action(
            "campaign_publish", "campaign", "c1", {"headline": "A"}
        )
        approval = Approval(
            tenant_id="t1",
            workflow_id="w1",
            principal_id="u1",
            action="campaign_publish",
            resource_type="campaign",
            resource_id="c1",
            action_fingerprint=fp,
            policy_version="v1",
            payload={"headline": "A"},
            status=ApprovalStatus.approved,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(approval)
        await db.commit()
        await db.refresh(approval)
        with pytest.raises(PermissionError):
            await recheck_before_execution(
                db,
                tenant_id="t1",
                approval_id=approval.id,
                action="campaign_publish",
                resource_type="campaign",
                resource_id="c1",
                payload={"headline": "TAMPERED"},
            )
    await engine.dispose()
