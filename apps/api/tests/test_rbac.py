import pytest


@pytest.mark.asyncio
async def test_me_roles(client):
    admin = await client.get("/api/v1/me", headers={"X-Demo-User": "user_demo_admin"})
    assert admin.status_code == 200
    assert admin.json()["role"] == "admin"

    member = await client.get("/api/v1/me", headers={"X-Demo-User": "user_demo_member"})
    assert member.status_code == 200
    assert member.json()["role"] == "member"

    approver = await client.get("/api/v1/me", headers={"X-Demo-User": "user_demo_approver"})
    assert approver.status_code == 200
    assert approver.json()["role"] == "approver"
