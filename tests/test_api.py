"""HTTP API: health, agents, tasks, orchestration, and admin."""

import pytest
from fastapi.testclient import TestClient

from luxor9.api.app import create_app


@pytest.fixture()
def client():
    # `with` triggers the lifespan that builds + bootstraps the orchestrator.
    with TestClient(create_app()) as c:
        yield c


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["agents"] == 12


def test_list_agents(client):
    resp = client.get("/api/v2/agents")
    assert resp.status_code == 200
    assert len(resp.json()) == 12


def test_submit_task_runs_and_returns_result(client):
    resp = client.post(
        "/api/v2/tasks",
        json={"title": "aggregate", "assigned_agent": "DATA_ANALYST", "input": {"data": [2, 4, 6]}},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "completed"
    assert body["result"]["stats"]["mean"] == 4

    # Round-trip via GET.
    got = client.get(f"/api/v2/tasks/{body['id']}")
    assert got.status_code == 200
    assert got.json()["id"] == body["id"]


def test_orchestrate_workflow_with_dependency(client):
    resp = client.post(
        "/api/v2/orchestrate",
        json={
            "tasks": [
                {
                    "id": "a",
                    "title": "analyze",
                    "assigned_agent": "DATA_ANALYST",
                    "input": {"data": [1, 2, 3]},
                },
                {
                    "id": "b",
                    "title": "report",
                    "assigned_agent": "OVERSEER",
                    "dependencies": ["a"],
                    "is_parallel": False,
                },
            ]
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert set(body["results"]) == {"a", "b"}

    workflow = client.get(f"/api/v2/orchestrate/{body['workflow_id']}")
    assert workflow.status_code == 200
    assert len(workflow.json()["tasks"]) == 2


def test_orchestrate_rejects_cycles(client):
    resp = client.post(
        "/api/v2/orchestrate",
        json={
            "tasks": [
                {"id": "a", "title": "a", "assigned_agent": "SPEEDSTER", "dependencies": ["b"]},
                {"id": "b", "title": "b", "assigned_agent": "SPEEDSTER", "dependencies": ["a"]},
            ]
        },
    )
    assert resp.status_code == 400


def test_admin_dashboard(client):
    resp = client.get("/api/v2/admin/dashboard")
    assert resp.status_code == 200
    body = resp.json()
    assert body["agents"]["total"] == 12
    assert "mock" in body["platforms"]
