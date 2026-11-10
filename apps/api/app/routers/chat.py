from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal
from app.database import get_db
from app.schemas.common import ChatMessageRequest, ChatMessageResponse, WorkflowOut
from app.services import workflows as workflow_service

router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.post("/chat", response_model=ChatMessageResponse)
async def chat(
    body: ChatMessageRequest,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    text = body.message.strip().lower()

    if body.workflow_id and text in {"approve", "approve blueprint", "yes"}:
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
                "action_approval"
                if wf.status.value == "awaiting_action_approval"
                else None
            ),
        )

    if body.workflow_id and text in {"decline", "decline blueprint", "no"}:
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
