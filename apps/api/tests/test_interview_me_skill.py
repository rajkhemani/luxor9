"""Interview Me skill — no automation until understanding is confirmed."""

import pytest


@pytest.mark.asyncio
async def test_chat_starts_interview_not_blueprint(client):
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
    assert body["awaiting"] == "interview_answer"
    assert body["workflow"]["status"] == "draft"
    assert body["workflow"]["blueprint"] is None
    assert "HYPOTHESIS:" in body["reply"]
    assert "Q:" in body["reply"]
    interview = body["workflow"]["context"]["interview"]
    assert interview["skill"] == "interview_me"
    assert interview["questions_asked"] >= 1
    assert interview["confidence"] < 95


@pytest.mark.asyncio
async def test_interview_blocks_automation_until_confirmed(client):
    first = await client.post(
        "/api/v1/chat",
        json={"message": "Automate my Dubai launch marketing"},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    wf_id = first.json()["workflow"]["id"]

    # Answer several interview turns with structured replies.
    answers = [
        "For our sales and marketing team launching Creek Harbour apartments.",
        "Success is a complete market/competitor pack with evidence gaps flagged.",
        "Constraint: stay in sandbox, no live ad spend.",
        "Out of scope: CRM writes and live channel publish.",
    ]
    body = None
    for answer in answers:
        res = await client.post(
            "/api/v1/chat",
            json={"message": answer, "workflow_id": wf_id},
            headers={"X-Demo-User": "user_demo_admin"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["workflow"]["blueprint"] is None
        assert body["workflow"]["status"] == "draft"

    assert body is not None
    # After enough answers we should be at restate / confirm, not automation yet.
    assert body["awaiting"] in {"interview_answer", "interview_confirm"}
    interview = body["workflow"]["context"]["interview"]
    assert interview["questions_asked"] >= interview["guardrails"]["min_questions"]

    if body["awaiting"] == "interview_confirm":
        confirmed = await client.post(
            "/api/v1/chat",
            json={"message": "yes", "workflow_id": wf_id},
            headers={"X-Demo-User": "user_demo_admin"},
        )
        assert confirmed.status_code == 200
        final = confirmed.json()
        assert final["awaiting"] == "blueprint_approval"
        assert final["workflow"]["status"] == "awaiting_blueprint_approval"
        assert final["workflow"]["blueprint"] is not None
        assert final["workflow"]["blueprint"]["status"] == "proposed"


@pytest.mark.asyncio
async def test_interview_guardrails_from_context(client):
    chat = await client.post(
        "/api/v1/chat",
        json={
            "message": "Help with a launch brief",
            "context": {
                "interview_guardrails": {
                    "min_questions": 2,
                    "confidence_threshold": 90,
                    "category": "b2b_real_estate",
                }
            },
        },
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert chat.status_code == 200
    g = chat.json()["workflow"]["context"]["interview"]["guardrails"]
    assert g["min_questions"] == 2
    assert g["confidence_threshold"] == 90
    assert g["category"] == "b2b_real_estate"


@pytest.mark.asyncio
async def test_chat_still_approves_after_interview(client):
    """Full path: interview → confirm → blueprint approve → CMO run."""
    first = await client.post(
        "/api/v1/chat",
        json={
            "message": "Need market and competitor intel for a Dubai creek residential launch",
            "context": {
                "location": "Dubai",
                "product_type": "residential",
                "interview_guardrails": {
                    "min_questions": 2,
                    "confidence_threshold": 80,
                    "category": "b2b_real_estate",
                },
            },
        },
        headers={"X-Demo-User": "user_demo_admin"},
    )
    wf_id = first.json()["workflow"]["id"]

    for answer in [
        "Sales team needs a launch intel pack for HNW buyers.",
        "Success: evidence-backed claims with UNVERIFIED gaps listed. Constraint: sandbox only.",
    ]:
        res = await client.post(
            "/api/v1/chat",
            json={"message": answer, "workflow_id": wf_id},
            headers={"X-Demo-User": "user_demo_admin"},
        )
        body = res.json()

    # Drive to confirm if not there yet
    turns = 0
    while body["awaiting"] == "interview_answer" and turns < 6:
        res = await client.post(
            "/api/v1/chat",
            json={
                "message": "Yes — outcome is market/competitor launch pack; out of scope is live ads.",
                "workflow_id": wf_id,
            },
            headers={"X-Demo-User": "user_demo_admin"},
        )
        body = res.json()
        turns += 1

    assert body["awaiting"] == "interview_confirm"
    confirmed = await client.post(
        "/api/v1/chat",
        json={"message": "yes", "workflow_id": wf_id},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert confirmed.json()["awaiting"] == "blueprint_approval"
    wf_id = confirmed.json()["workflow"]["id"]

    approved = await client.post(
        "/api/v1/chat",
        json={"message": "approve", "workflow_id": wf_id},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert approved.status_code == 200
    result = approved.json()["workflow"]
    assert result["status"] in {"awaiting_action_approval", "completed"}
    assert result["report"] is not None
