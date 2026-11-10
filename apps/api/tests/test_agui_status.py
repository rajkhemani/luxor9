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
