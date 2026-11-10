import pytest


@pytest.mark.asyncio
async def test_demo_run(client):
    res = await client.post("/api/v1/demo/run", headers={"X-Demo-User": "user_demo_admin"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] in {"awaiting_action_approval", "completed"}
    assert body["report"] is not None
    assert body["blueprint"]["status"] == "approved"
