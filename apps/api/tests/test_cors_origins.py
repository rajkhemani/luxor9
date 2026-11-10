from fastapi.testclient import TestClient

from app.main import app


def test_cors_allows_localhost_and_loopback_tower_origins():
    client = TestClient(app)
    for origin in ("http://localhost:3000", "http://127.0.0.1:3000"):
        res = client.options(
            "/api/v1/chat",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,x-demo-user",
            },
        )
        assert res.status_code == 200
        assert res.headers.get("access-control-allow-origin") == origin
