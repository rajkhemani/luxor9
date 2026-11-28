from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal, require_roles
from app.config import get_settings
from app.database import get_db
from app.models.entities import RoleName, WorkflowStatus
from app.schemas.common import ChatMessageRequest, ChatMessageResponse, WorkflowOut
from app.services import workflows as workflow_service
from app.skills.interview_me import InterviewEngine, resolve_guardrails

router = APIRouter(prefix="/api/v1", tags=["chat"])

_APPROVE = {"approve", "approve blueprint", "yes", "yes approve", "approve it"}
_DECLINE = {"decline", "decline blueprint", "no", "reject", "reject blueprint"}


def _merge_guardrails(context: dict) -> dict:
    """Seed interview_guardrails from settings when caller omitted them."""
    settings = get_settings()
    ctx = dict(context or {})
    raw = dict(ctx.get("interview_guardrails") or {})
    raw.setdefault("enabled", settings.interview_enabled)
    raw.setdefault("min_questions", settings.interview_min_questions)
    raw.setdefault("confidence_threshold", settings.interview_confidence_threshold)
    raw.setdefault("category", settings.interview_category)
    ctx["interview_guardrails"] = raw
    return ctx


@router.post("/chat", response_model=ChatMessageResponse)
async def chat(
    body: ChatMessageRequest,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    text = body.message.strip().lower()
    context = _merge_guardrails(body.context)

    if body.workflow_id and text in _APPROVE:
        wf = await workflow_service.get_workflow(db, principal.tenant_id, body.workflow_id)
        if wf is None:
            raise HTTPException(status_code=404, detail="Workflow not found")
        # During interview confirm, "yes" means intent confirmation — not blueprint approve.
        interview = (wf.context or {}).get("interview") or {}
        if wf.status == WorkflowStatus.draft and interview.get("phase") == "restate":
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

        if wf.status == WorkflowStatus.draft and (wf.context or {}).get("interview"):
            return await _continue_interview(db, principal, wf.id, body.message)

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
    guardrails = resolve_guardrails(context)
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
    ctx = dict(wf.context or {})
    interview_state = dict(ctx.get("interview") or {})
    guardrails = resolve_guardrails(ctx)
    engine = InterviewEngine(guardrails)
    result = engine.continue_(interview_state, message)
    ctx["interview"] = result.state
    wf = await workflow_service.save_workflow_context(db, principal.tenant_id, workflow_id, ctx)

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


# Keep require_roles import used for future route splits / lint stability.
_ = require_roles
