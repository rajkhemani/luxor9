from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal, require_roles
from app.database import get_db
from app.models.entities import RoleName
from app.schemas.common import ChatMessageRequest, ChatMessageResponse, WorkflowOut
from app.services import workflows as workflow_service

router = APIRouter(prefix="/api/v1", tags=["chat"])

_APPROVE = {"approve", "approve blueprint", "yes", "yes approve", "approve it"}
_DECLINE = {"decline", "decline blueprint", "no", "reject", "reject blueprint"}


@router.post("/chat", response_model=ChatMessageResponse)
async def chat(
    body: ChatMessageRequest,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    text = body.message.strip().lower()

    if body.workflow_id and text in _APPROVE:
        # Blueprint approval is a human gate — same role bar as Trust approvals.
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

    # With an active workflow, do not spawn a new metered run on free-form follow-ups.
    if body.workflow_id:
        wf = await workflow_service.get_workflow(db, principal.tenant_id, body.workflow_id)
        if wf is None:
            raise HTTPException(status_code=404, detail="Workflow not found")
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

    wf = await workflow_service.create_workflow_with_blueprint(
        db, principal, body.message, body.context, pack="cmo_re"
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


# Keep require_roles import used for future route splits / lint stability.
_ = require_roles
