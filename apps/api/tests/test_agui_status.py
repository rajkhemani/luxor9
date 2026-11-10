from fastapi.testclient import TestClient

from app.main import app


def test_agui_status_reports_cmo_agent():
    client = TestClient(app)
    res = client.get("/api/v1/agui/status")
    assert res.status_code == 200
    body = res.json()
    assert body["enabled"] is True
    assert body["agents"][0]["name"] == "luxor9_cmo"
    assert body["agents"][0]["path"] == "/api/v1/agui/cmo"
    conn = body["connectivity"]
    assert conn["bucket"] == 2
    assert conn["protocol"] == "ag-ui"
    assert conn["capabilities"]["live_stream"] is True
    assert conn["capabilities"]["human_in_the_loop"] is True
    assert conn["learning_bucket"] == 3
    assert conn["learning_status"] == "phase2_luxor_intelligence"
    assert "coworker_hub" in body
    assert "duo_skin" in body
    assert "openbot" not in body
    assert "openduet" not in body
    assert "CopilotKit" not in body.get("intelligence", "")
