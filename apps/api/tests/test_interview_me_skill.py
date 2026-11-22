"""Interview Me skill — no automation until understanding is confirmed."""

import pytest

from app.skills.interview_me.engine import InterviewEngine
from app.skills.interview_me.guardrails import InterviewGuardrails, resolve_guardrails


@pytest.mark.asyncio
async def test_yes_during_questioning_stays_in_interview(client):
    """Bare 'yes' while interviewing must not hit blueprint approval."""
    first = await client.post(
        "/api/v1/chat",
        json={"message": "Automate my Dubai launch marketing"},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert first.status_code == 200
    wf_id = first.json()["workflow"]["id"]
    assert first.json()["awaiting"] == "interview_answer"

    yes = await client.post(
        "/api/v1/chat",
        json={"message": "yes", "workflow_id": wf_id},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert yes.status_code == 200
    body = yes.json()
    assert body["workflow"]["status"] == "draft"
    assert body["workflow"]["blueprint"] is None
    assert body["awaiting"] in {"interview_answer", "interview_confirm"}
    assert body["workflow"]["context"]["interview"]["phase"] in {
        "questioning",
        "restate",
    }


def test_restate_yes_prefix_is_refinement_not_confirm():
    engine = InterviewEngine(InterviewGuardrails(min_questions=2, confidence_threshold=80))
    state = {
        "phase": "restate",
        "confidence": 85,
        "questions_asked": 3,
        "statement": {
            "outcome": "launch pack",
            "user": "sales",
            "why_now": "Q2",
            "success": "evidence",
            "constraint": "sandbox",
            "out_of_scope": "live ads",
        },
        "objective": "Automate Dubai launch",
        "asked_ids": [],
        "answers": [],
        "pending_field": None,
        "hypothesis": "test",
        "guardrails": {},
    }
    result = engine.continue_(
        state,
        "Yes — outcome is market/competitor launch pack; out of scope is live ads.",
    )
    assert result.ready_for_automation is False
    assert result.awaiting == "interview_confirm"
    assert result.state["phase"] == "restate"


def test_resolve_guardrails_rejects_non_numeric_overrides():
    with pytest.raises(ValueError, match="interview_guardrails"):
        resolve_guardrails(
            {"interview_guardrails": {"min_questions": "many", "confidence_threshold": 90}}
        )


def test_resolve_guardrails_coerces_string_false():
    g = resolve_guardrails(
        {
            "interview_guardrails": {
                "enabled": "false",
                "require_explicit_yes": "false",
            }
        }
    )
    assert g.enabled is False
    assert g.require_explicit_yes is False


def test_restate_no_asks_next_question_instead_of_loop():
    engine = InterviewEngine(InterviewGuardrails(min_questions=2, confidence_threshold=80))
    state = {
        "phase": "restate",
        "confidence": 90,
        "questions_asked": 2,
        "statement": {
            "outcome": "launch pack",
            "user": "sales",
            "why_now": "Q2",
            "success": "evidence",
            "constraint": "sandbox",
            "out_of_scope": "live ads",
        },
        "objective": "Automate Dubai launch",
            "asked_ids": ["re_who", "re_outcome"],
        "answers": [],
        "pending_field": None,
        "hypothesis": "test",
        "guardrails": {},
    }
    result = engine.continue_(state, "no")
    assert result.ready_for_automation is False
    assert result.awaiting == "interview_answer"
    assert result.state["phase"] == "questioning"
    assert "Q:" in result.reply
    assert result.state["questions_asked"] == 3


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
