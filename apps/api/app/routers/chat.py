from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal
from app.config import get_settings
from app.database import get_db
from app.models.entities import RoleName, WorkflowStatus
from app.schemas.common import ChatMessageRequest, ChatMessageResponse, WorkflowOut
from app.services import workflows as workflow_service
from app.skills.interview_me import InterviewEngine, resolve_guardrails

router = APIRouter(prefix="/api/v1", tags=["chat"])

# Bare "yes" is Interview Me confirmation only — never blueprint execution.
_APPROVE = {"approve", "approve blueprint", "yes approve", "approve it"}
_DECLINE = {"decline", "decline blueprint", "no", "reject", "reject blueprint"}


def _merge_guardrails(context: dict) -> dict:
    """Seed interview_guardrails from settings when caller omitted them."""
    settings = get_settings()
    ctx = dict(context or {})
    raw = ctx.get("interview_guardrails") or {}
    if raw is not None and not isinstance(raw, dict):
        raise ValueError("interview_guardrails must be an object")
    raw = dict(raw)
    raw.setdefault("enabled", settings.interview_enabled)
    raw.setdefault("min_questions", settings.interview_min_questions)
    raw.setdefault("confidence_threshold", settings.interview_confidence_threshold)
    raw.setdefault("category", settings.interview_category)
    ctx["interview_guardrails"] = raw
    return ctx


def _ensure_interview_actor(wf, principal: Principal) -> None:
    """Only the creator (or admin) may continue / confirm an interview."""
    if principal.role == RoleName.admin:
        return
    if wf.created_by_user_id != principal.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the workflow creator can continue this interview",
        )


@router.post("/chat", response_model=ChatMessageResponse)
async def chat(
    body: ChatMessageRequest,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    text = body.message.strip().lower()
    try:
        context = _merge_guardrails(body.context)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if body.workflow_id and text in _APPROVE:
        wf = await workflow_service.get_workflow(db, principal.tenant_id, body.workflow_id)
        if wf is None:
            raise HTTPException(status_code=404, detail="Workflow not found")
        # Active Interview Me: never treat approve aliases as blueprint approval.
        interview = (wf.context or {}).get("interview") or {}
        if wf.status == WorkflowStatus.draft and interview.get("phase") in {
            "questioning",
            "restate",
            "confirmed",
        }:
            return await _continue_interview(db, principal, wf.id, body.message)
        if principal.role not in {RoleName.admin, RoleName.approver}:
            raise HTTPException(status_code=403, detail="Approver role required")
        try:
            wf = await workflow_service.decide_blueprint(
                db, principal, body.workflow_id, "approve", "chat approval"
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return ChatMessageResponse(
            reply="Blueprint approved. Hierarchical agents are executing the plan.",
            workflow=WorkflowOut(**workflow_service.workflow_to_dict(wf)),
            awaiting=(
                "action_approval" if wf.status.value == "awaiting_action_approval" else None
            ),
        )

    if body.workflow_id and text in _DECLINE:
        wf = await workflow_service.get_workflow(db, principal.tenant_id, body.workflow_id)
        if wf is None:
            raise HTTPException(status_code=404, detail="Workflow not found")
        interview = (wf.context or {}).get("interview") or {}
        if wf.status == WorkflowStatus.draft and interview.get("phase") in {
            "restate",
            "questioning",
            "confirmed",
        }:
            return await _continue_interview(db, principal, wf.id, body.message)
        if principal.role not in {RoleName.admin, RoleName.approver}:
            raise HTTPException(status_code=403, detail="Approver role required")
        try:
            wf = await workflow_service.decide_blueprint(
                db, principal, body.workflow_id, "decline", "chat decline"
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return ChatMessageResponse(
            reply="Blueprint declined. Workflow closed without execution.",
            workflow=WorkflowOut(**workflow_service.workflow_to_dict(wf)),
            awaiting=None,
        )

    if body.workflow_id:
        wf = await workflow_service.get_workflow(db, principal.tenant_id, body.workflow_id)
        if wf is None:
            raise HTTPException(status_code=404, detail="Workflow not found")

        interview = (wf.context or {}).get("interview") or {}
        if wf.status == WorkflowStatus.draft and interview:
            return await _continue_interview(db, principal, wf.id, body.message)

        # Bare "yes" after interview must never execute the blueprint.
        if (
            wf.status == WorkflowStatus.awaiting_blueprint_approval
            and text in {"yes", "yes.", "y"}
        ):
            return ChatMessageResponse(
                reply=(
                    "Blueprint is ready. Reply **approve** to dispatch the CMO hierarchy, "
                    "or **decline** to cancel."
                ),
                workflow=WorkflowOut(**workflow_service.workflow_to_dict(wf)),
                awaiting="blueprint_approval",
            )

        awaiting = None
        if wf.status.value == "awaiting_blueprint_approval":
            awaiting = "blueprint_approval"
            reply = (
                "This workflow still awaits blueprint approval. "
                "Reply **approve** or **decline** (approver/admin only)."
            )
        elif wf.status.value == "awaiting_action_approval":
            awaiting = "action_approval"
            reply = (
                "Blueprint already approved. Open the Approval centre to decide the "
                "sandbox campaign publish action."
            )
        else:
            reply = (
                f"Continuing workflow `{wf.id}` (status: {wf.status.value}). "
                "Start a new objective in a fresh chat without an attached workflow id."
            )
        return ChatMessageResponse(
            reply=reply,
            workflow=WorkflowOut(**workflow_service.workflow_to_dict(wf)),
            awaiting=awaiting,
        )

    # New chat — Interview Me before any blueprint/automation.
    try:
        guardrails = resolve_guardrails(context)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not guardrails.enabled:
        wf = await workflow_service.create_workflow_with_blueprint(
            db, principal, body.message, context, pack="cmo_re"
        )
        bp = wf.blueprint
        reply = (
            f"I drafted a governed blueprint: **{bp.title}**.\n\n"
            f"{bp.summary}\n\n"
            "Reply **approve** to dispatch the CMO hierarchy, or **decline** to cancel."
        )
        return ChatMessageResponse(
            reply=reply,
            workflow=WorkflowOut(**workflow_service.workflow_to_dict(wf)),
            awaiting="blueprint_approval",
        )

    engine = InterviewEngine(guardrails)
    result = engine.start(body.message)
    ctx = {**context, "interview": result.state}
    wf = await workflow_service.create_interview_workflow(
        db, principal, body.message, ctx, pack="cmo_re"
    )
    return ChatMessageResponse(
        reply=result.reply,
        workflow=WorkflowOut(**workflow_service.workflow_to_dict(wf)),
        awaiting=result.awaiting,
    )


async def _continue_interview(
    db: AsyncSession, principal: Principal, workflow_id: str, message: str
) -> ChatMessageResponse:
    wf = await workflow_service.get_workflow(db, principal.tenant_id, workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    _ensure_interview_actor(wf, principal)
    ctx = dict(wf.context or {})
    interview_state = dict(ctx.get("interview") or {})
    try:
        guardrails = resolve_guardrails(ctx)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    engine = InterviewEngine(guardrails)
    result = engine.continue_(interview_state, message)
    ctx["interview"] = result.state
    # Re-lock + merge first so a concurrent confirm cannot be wiped by a stale continue.
    wf = await workflow_service.save_workflow_context(db, principal.tenant_id, workflow_id, ctx)
    locked_ctx = dict(wf.context or {})
    if locked_ctx.get("interview_confirmed") and wf.blueprint is not None:
        return ChatMessageResponse(
            reply=(
                "Intent is already confirmed and a blueprint is proposed. "
                "Reply **approve** to dispatch, or **decline** to cancel."
            ),
            workflow=WorkflowOut(**workflow_service.workflow_to_dict(wf)),
            awaiting="blueprint_approval",
        )

    if result.ready_for_automation:
        try:
            wf = await workflow_service.attach_blueprint_after_interview(
                db, principal, workflow_id
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        bp = wf.blueprint
        reply = (
            f"{result.reply}\n\n"
            f"I drafted a governed blueprint: **{bp.title}**.\n\n"
            f"{bp.summary}\n\n"
            "Reply **approve** to dispatch the CMO hierarchy, or **decline** to cancel."
        )
        return ChatMessageResponse(
            reply=reply,
            workflow=WorkflowOut(**workflow_service.workflow_to_dict(wf)),
            awaiting="blueprint_approval",
        )

    return ChatMessageResponse(
        reply=result.reply,
        workflow=WorkflowOut(**workflow_service.workflow_to_dict(wf)),
        awaiting=result.awaiting,
    )
