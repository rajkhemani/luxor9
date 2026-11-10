import pytest


@pytest.mark.asyncio
async def test_chat_blueprint_approve_runs_cmo(client):
    chat = await client.post(
        "/api/v1/chat",
        json={
            "message": "Need market and competitor intel for a Dubai creek residential launch",
            "context": {"location": "Dubai", "product_type": "residential"},
        },
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert chat.status_code == 200
    body = chat.json()
    assert body["awaiting"] == "blueprint_approval"
    wf_id = body["workflow"]["id"]
    assert body["workflow"]["status"] == "awaiting_blueprint_approval"
    assert body["workflow"]["blueprint"]["status"] == "proposed"

    approved = await client.post(
        "/api/v1/chat",
        json={"message": "approve", "workflow_id": wf_id},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert approved.status_code == 200
    result = approved.json()["workflow"]
    assert result["status"] in {"awaiting_action_approval", "completed"}
    assert result["report"] is not None
    assert "claims" in result["report"]
    assert any(c.get("status") == "UNVERIFIED" for c in result["report"]["claims"])

    evidence = await client.get(
        f"/api/v1/workflows/{wf_id}/evidence",
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert evidence.status_code == 200
    assert len(evidence.json()) >= 1

    metering = await client.get("/api/v1/metering", headers={"X-Demo-User": "user_demo_admin"})
    assert metering.status_code == 200
    names = {m["event_name"] for m in metering.json()}
    assert "workflow_run.created" in names
    assert "workflow_run.executed" in names


@pytest.mark.asyncio
async def test_blueprint_decline(client):
    chat = await client.post(
        "/api/v1/chat",
        json={"message": "Quick competitor scan for Business Bay"},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    wf_id = chat.json()["workflow"]["id"]
    declined = await client.post(
        "/api/v1/chat",
        json={"message": "decline", "workflow_id": wf_id},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert declined.status_code == 200
    assert declined.json()["workflow"]["status"] == "declined"


@pytest.mark.asyncio
async def test_agents_directory(client):
    res = await client.get("/api/v1/agents", headers={"X-Demo-User": "user_demo_admin"})
    assert res.status_code == 200
    body = res.json()
    assert body["packs"][0]["pack"] == "cmo_re"
    assert len(body["packs"][0]["specialists"]) >= 3
