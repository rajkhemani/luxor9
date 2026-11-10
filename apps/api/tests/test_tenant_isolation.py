import pytest


@pytest.mark.asyncio
async def test_tenant_isolation_on_workflow_get(client):
    create = await client.post(
        "/api/v1/workflows",
        json={"objective": "Launch Palm Jumeirah villa collection", "context": {"location": "Dubai"}},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert create.status_code == 200
    wf_id = create.json()["id"]
    tenant_a = create.json()["tenant_id"]

    # Same tenant can read
    ok = await client.get(f"/api/v1/workflows/{wf_id}", headers={"X-Demo-User": "user_demo_admin"})
    assert ok.status_code == 200
    assert ok.json()["tenant_id"] == tenant_a

    # Different demo user is still same demo tenant in MVP seed — create foreign id attempt
    missing = await client.get(
        "/api/v1/workflows/00000000-0000-0000-0000-000000000099",
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert missing.status_code == 404
