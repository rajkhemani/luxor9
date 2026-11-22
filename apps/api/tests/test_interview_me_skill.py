"""Interview Me skill — no automation until understanding is confirmed."""

import pytest

from app.skills.interview_me.engine import InterviewEngine
from app.skills.interview_me.guardrails import InterviewGuardrails, resolve_guardrails


@pytest.mark.asyncio
async def test_yes_during_questioning_accepts_guess_not_blueprint(client):
    """Bare 'yes' accepts the GUESS for the pending field — never drafts a blueprint."""
    first = await client.post(
        "/api/v1/chat",
        json={"message": "Automate my Dubai launch marketing"},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert first.status_code == 200
    wf_id = first.json()["workflow"]["id"]
    assert first.json()["awaiting"] == "interview_answer"
    pending = first.json()["workflow"]["context"]["interview"]["pending_field"]

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
    interview = body["workflow"]["context"]["interview"]
    assert interview["phase"] in {"questioning", "restate"}
    statement = interview["statement"]
    assert pending in statement
    assert statement[pending].lower() != "yes"
    assert len(statement[pending]) > 3


def test_no_during_questioning_rejects_guess_without_storing_no():
    engine = InterviewEngine(InterviewGuardrails(min_questions=2, confidence_threshold=80))
    started = engine.start("Automate Dubai launch")
    pending = started.state["pending_field"]
    result = engine.continue_(started.state, "no")
    assert result.awaiting == "interview_answer"
    assert result.state["phase"] == "questioning"
    assert result.state["pending_field"] == pending
    assert "no" not in str((result.state.get("statement") or {}).get(pending, "")).lower()
    assert result.state["questions_asked"] == 1


def test_three_substantive_answers_reach_restate_at_default_threshold():
    """Default gates: three Q&A turns that fill three fields must enter restate."""
    engine = InterviewEngine(InterviewGuardrails())  # min=3, threshold=95
    state = engine.start("Automate Dubai launch").state
    answers = [
        "For our sales and marketing launch team.",
        "Success is an evidence-backed launch pack with gaps flagged.",
        "Constraint: sandbox only, no live ad spend.",
    ]
    result = None
    for answer in answers:
        result = engine.continue_(state, answer)
        state = result.state
    assert result is not None
    assert result.awaiting == "interview_confirm"
    assert result.state["phase"] == "restate"
    assert int(result.state["confidence"]) >= 95


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
    assert body["awaiting"] == "interview_confirm"
    interview = body["workflow"]["context"]["interview"]
    assert interview["questions_asked"] >= interview["guardrails"]["min_questions"]

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

    # Retried bare yes must not approve/execute the blueprint.
    retry = await client.post(
        "/api/v1/chat",
        json={"message": "yes", "workflow_id": wf_id},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    assert retry.status_code == 200
    assert retry.json()["awaiting"] == "blueprint_approval"
    assert retry.json()["workflow"]["status"] == "awaiting_blueprint_approval"


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


@pytest.mark.asyncio
async def test_member_cannot_continue_others_interview(client):
    first = await client.post(
        "/api/v1/chat",
        json={"message": "Automate my Dubai launch marketing"},
        headers={"X-Demo-User": "user_demo_admin"},
    )
    wf_id = first.json()["workflow"]["id"]
    hijack = await client.post(
        "/api/v1/chat",
        json={"message": "Sales team needs a launch pack", "workflow_id": wf_id},
        headers={"X-Demo-User": "user_demo_member"},
    )
    assert hijack.status_code == 403


def test_blank_answers_do_not_advance_interview():
    engine = InterviewEngine(InterviewGuardrails(min_questions=2, confidence_threshold=80))
    started = engine.start("Automate Dubai launch")
    result = engine.continue_(started.state, "   ")
    assert result.ready_for_automation is False
    assert result.awaiting == "interview_answer"
    assert result.state["questions_asked"] == 1
    assert result.state["phase"] == "questioning"


def test_resolve_guardrails_rejects_fractional_and_non_mapping():
    with pytest.raises(ValueError, match="interview_guardrails"):
        resolve_guardrails({"interview_guardrails": {"min_questions": 2.5}})
    with pytest.raises(ValueError, match="interview_guardrails"):
        resolve_guardrails({"interview_guardrails": ["not", "a", "mapping"]})


@pytest.mark.asyncio
async def test_save_context_does_not_invent_interview_confirmed(db_engine):
    """Merging with intent alone must not stamp interview_confirmed=True."""
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from app.models.entities import Workflow, WorkflowStatus
    from app.services import workflows as workflow_service

    Session = async_sessionmaker(db_engine, expire_on_commit=False)
    async with Session() as db:
        wf = Workflow(
            tenant_id="tenant_demo_dubai",
            created_by_user_id="user_demo_admin",
            pack="cmo_re",
            objective="Automate Dubai launch",
            status=WorkflowStatus.draft,
            context={"interview": {"phase": "questioning"}, "intent": {"outcome": "partial"}},
        )
        db.add(wf)
        await db.commit()
        await db.refresh(wf)
        saved = await workflow_service.save_workflow_context(
            db,
            "tenant_demo_dubai",
            wf.id,
            {"interview": {"phase": "questioning"}, "intent": {"outcome": "partial"}},
        )
        assert saved.context.get("intent") == {"outcome": "partial"}
        assert saved.context.get("interview_confirmed") is not True


def test_sales_budget_phrase_does_not_fill_user_field():
    from app.skills.interview_me.engine import _apply_keyword_fields

    statement: dict[str, str] = {}
    _apply_keyword_fields(statement, "our sales targets are aggressive", overwrite=False)
    assert "user" not in statement
    _apply_keyword_fields(statement, "for our sales and marketing launch team", overwrite=False)
    assert "user" in statement


def test_pending_answer_keeps_full_text_not_keyword_suffix():
    engine = InterviewEngine(InterviewGuardrails(min_questions=2, confidence_threshold=80))
    state = engine.start("Automate Dubai launch").state
    # Accept path via substantive answer that contains soft words.
    result = engine.continue_(
        state,
        "Sales + marketing launch team, because market-to-launch briefs usually serve that group first.",
    )
    user = result.state["statement"]["user"]
    assert user.startswith("Sales + marketing")
    assert user != "and"
    assert "serve that group first" in user


def test_soft_sandbox_fills_canned_constraint_without_truncating_pending():
    engine = InterviewEngine(InterviewGuardrails(min_questions=2, confidence_threshold=80))
    started = engine.start("Automate Dubai launch")
    state = engine.continue_(started.state, "for our sales launch war-room").state
    result = engine.continue_(
        state,
        "Success is an evidence-backed launch pack with gaps flagged.",
    )
    # Pending field for Q2 is outcome — full sentence must stick.
    assert "evidence-backed launch pack" in result.state["statement"]["outcome"].lower()
    assert result.state["statement"]["outcome"] != "backed launch pack with gaps flagged."


def test_refinement_parses_field_values_not_whole_utterance():
    engine = InterviewEngine(InterviewGuardrails(min_questions=2, confidence_threshold=80))
    state = {
        "phase": "restate",
        "confidence": 85,
        "questions_asked": 3,
        "statement": {
            "outcome": "old pack",
            "user": "sales",
            "why_now": "Q2",
            "success": "evidence",
            "constraint": "sandbox",
            "out_of_scope": "old scope",
        },
        "objective": "Automate Dubai launch",
        "asked_ids": ["re_who", "re_outcome", "re_success"],
        "answers": [],
        "pending_field": None,
        "hypothesis": "test",
        "guardrails": {},
    }
    result = engine.continue_(
        state,
        "Yes — outcome is market/competitor launch pack; out of scope is live ads.",
    )
    assert result.state["phase"] == "restate"
    outcome = result.state["statement"]["outcome"]
    oos = result.state["statement"]["out_of_scope"]
    assert "market/competitor launch pack" in outcome.lower()
    assert "live ads" in oos.lower()
    assert "out of scope" not in outcome.lower()
    assert outcome != oos
    assert "Yes —" not in outcome
