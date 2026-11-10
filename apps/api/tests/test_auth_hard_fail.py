import pytest

from app.config import get_settings


@pytest.mark.asyncio
async def test_production_rejects_unverified_bearer(client, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("AUTH_DISABLED_FOR_TESTS", "false")
    monkeypatch.setenv("CLERK_JWKS_URL", "")
    get_settings.cache_clear()
    try:
        res = await client.get("/api/v1/me", headers={"Authorization": "Bearer totally-fake"})
        assert res.status_code == 401
        assert "JWKS" in res.json()["detail"] or "unverified" in res.json()["detail"].lower()
    finally:
        monkeypatch.setenv("ENVIRONMENT", "development")
        monkeypatch.setenv("AUTH_DISABLED_FOR_TESTS", "true")
        get_settings.cache_clear()


@pytest.mark.asyncio
async def test_chat_followup_does_not_spawn_new_workflow(client):
    first = await client.post(
        "/api/v1/chat",
        json={"message": "Research Dubai hills villas"},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    wf_id = first.json()["workflow"]["id"]
    follow = await client.post(
        "/api/v1/chat",
        json={"message": "can you add more competitors?", "workflow_id": wf_id},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert follow.status_code == 200
    assert follow.json()["workflow"]["id"] == wf_id
    assert follow.json()["awaiting"] == "blueprint_approval"

    listed = await client.get("/api/v1/workflows", headers={"X-Demo-User": "user_demo_admin"})
    assert sum(1 for w in listed.json() if w["id"] == wf_id) == 1
    assert len(listed.json()) == 1


@pytest.mark.asyncio
async def test_member_cannot_approve_blueprint(client):
    created = await client.post(
        "/api/v1/chat",
        json={"message": "Launch plan for marina"},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    wf_id = created.json()["workflow"]["id"]
    denied = await client.post(
        "/api/v1/chat",
        json={"message": "approve", "workflow_id": wf_id},
        headers={"X-Demo-User": "user_demo_member"},
    )
    assert denied.status_code == 403
