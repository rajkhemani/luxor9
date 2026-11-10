from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.adapters.sandbox_publish import sandbox_campaign_publish
from app.auth import Principal
from app.executives import cmo
from app.intelligence.graph import run_cmo_hierarchy
from app.models.entities import (
    ApprovalStatus,
    Blueprint,
    BlueprintStatus,
    Claim,
    ClaimEvidence,
    ClaimStatus,
    EvidenceItem,
    EvidenceSource,
    Workflow,
    WorkflowEvent,
    WorkflowStatus,
    WorkflowTask,
)
from app.services import metering, trust
from app.services.audit import emit_audit


def _bp_out(bp: Blueprint | None) -> dict | None:
    if bp is None:
        return None
    return {
        "id": bp.id,
        "workflow_id": bp.workflow_id,
        "status": bp.status.value,
        "title": bp.title,
        "summary": bp.summary,
        "plan": bp.plan,
    }


def workflow_to_dict(wf: Workflow) -> dict:
    return {
        "id": wf.id,
        "tenant_id": wf.tenant_id,
        "objective": wf.objective,
        "status": wf.status.value,
        "pack": wf.pack,
        "context": wf.context or {},
        "report": wf.report,
        "blueprint": _bp_out(wf.blueprint),
        "created_at": wf.created_at,
    }


async def create_workflow_with_blueprint(
    db: AsyncSession, principal: Principal, objective: str, context: dict, pack: str = "cmo_re"
) -> Workflow:
    draft = cmo.build_blueprint(objective, context)
    wf = Workflow(
        tenant_id=principal.tenant_id,
        created_by_user_id=principal.user_id,
        pack=pack,
        objective=objective,
        status=WorkflowStatus.awaiting_blueprint_approval,
        context=context,
    )
    db.add(wf)
    await db.flush()
    bp = Blueprint(
        tenant_id=principal.tenant_id,
        workflow_id=wf.id,
        status=BlueprintStatus.proposed,
        title=draft["title"],
        summary=draft["summary"],
        plan=draft["plan"],
    )
    db.add(bp)
    db.add(
        WorkflowEvent(
            tenant_id=principal.tenant_id,
            workflow_id=wf.id,
            event_type="blueprint.proposed",
            payload={"title": bp.title},
        )
    )
    await metering.emit_metering(
        db,
        tenant_id=principal.tenant_id,
        event_name="workflow_run.created",
        workflow_id=wf.id,
        meta={"pack": pack},
    )
    await emit_audit(
        db,
        tenant_id=principal.tenant_id,
        actor_id=principal.user_id,
        event_type="workflow.created",
        resource_type="workflow",
        resource_id=wf.id,
        payload={"objective": objective},
    )
    await db.commit()
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == wf.id, Workflow.tenant_id == principal.tenant_id)
        .options(selectinload(Workflow.blueprint))
    )
    return result.scalar_one()


async def decide_blueprint(
    db: AsyncSession, principal: Principal, workflow_id: str, decision: str, reason: str = ""
) -> Workflow:
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.tenant_id == principal.tenant_id)
        .options(selectinload(Workflow.blueprint))
        .with_for_update()
    )
    wf = result.scalar_one_or_none()
    if wf is None or wf.blueprint is None:
        raise ValueError("workflow_not_found")
    if wf.status != WorkflowStatus.awaiting_blueprint_approval:
        raise ValueError("blueprint_not_awaiting")

    bp = wf.blueprint
    bp.decided_by_user_id = principal.user_id
    bp.decided_at = datetime.now(timezone.utc)
    if decision == "decline":
        bp.status = BlueprintStatus.declined
        wf.status = WorkflowStatus.declined
        db.add(
            WorkflowEvent(
                tenant_id=principal.tenant_id,
                workflow_id=wf.id,
                event_type="blueprint.declined",
                payload={"reason": reason},
            )
        )
        await db.commit()
        await db.refresh(wf)
        return wf

    bp.status = BlueprintStatus.approved
    wf.status = WorkflowStatus.running
    db.add(
        WorkflowEvent(
            tenant_id=principal.tenant_id,
            workflow_id=wf.id,
            event_type="blueprint.approved",
            payload={"reason": reason},
        )
    )
    # Flush only — execute then commit once so graph failures leave the blueprint re-decidable.
    await db.flush()
    try:
        return await execute_approved_workflow(db, principal, wf.id, commit=True)
    except Exception:
        await db.rollback()
        raise


async def _persist_report_artifacts(db: AsyncSession, wf: Workflow, report: dict) -> None:
    claim_id_by_text: dict[str, str] = {}
    for src in report.get("sources", []):
        source = EvidenceSource(
            tenant_id=wf.tenant_id,
            workflow_id=wf.id,
            source_type=src.get("source_type", "public_web"),
            canonical_uri=src["canonical_uri"],
            title=src.get("title", ""),
            publisher=src.get("publisher", ""),
            content_hash=src.get("content_hash", ""),
            meta={"excerpt": src.get("excerpt", "")},
        )
        db.add(source)
        await db.flush()
        item = EvidenceItem(
            tenant_id=wf.tenant_id,
            workflow_id=wf.id,
            source_id=source.id,
            excerpt=src.get("excerpt", ""),
            locator="body",
        )
        db.add(item)
        await db.flush()
        for claim in report.get("claims", []):
            source_ref = claim.get("source")
            if source_ref and source_ref.get("canonical_uri") == src["canonical_uri"]:
                status = ClaimStatus[claim.get("status", "VERIFIED")]
                c = Claim(
                    tenant_id=wf.tenant_id,
                    workflow_id=wf.id,
                    claim_text=claim["claim_text"],
                    claim_type=claim.get("claim_type", "market"),
                    status=status,
                    confidence=float(claim.get("confidence", 0.5)),
                )
                db.add(c)
                await db.flush()
                db.add(
                    ClaimEvidence(
                        tenant_id=wf.tenant_id,
                        claim_id=c.id,
                        evidence_item_id=item.id,
                        relation="supports",
                    )
                )
                claim_id_by_text[claim["claim_text"]] = c.id

    for claim in report.get("claims", []):
        if claim.get("source") is None and claim["claim_text"] not in claim_id_by_text:
            status = ClaimStatus[claim.get("status", "UNVERIFIED")]
            c = Claim(
                tenant_id=wf.tenant_id,
                workflow_id=wf.id,
                claim_text=claim["claim_text"],
                claim_type=claim.get("claim_type", "forecast"),
                status=status,
                confidence=float(claim.get("confidence", 0.2)),
                uncertainty_notes="No supporting evidence source",
            )
            db.add(c)


async def execute_approved_workflow(
    db: AsyncSession, principal: Principal, workflow_id: str, commit: bool = True
) -> Workflow:
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.tenant_id == principal.tenant_id)
        .options(selectinload(Workflow.blueprint))
    )
    wf = result.scalar_one()
    graph_result = await run_cmo_hierarchy(wf.objective, wf.context or {})
    report = graph_result.get("report") or {}

    for spec in cmo.CMO_PACK["specialists"]:
        key = spec["agent_key"]
        output = {
            "market": graph_result.get("market"),
            "competitor": graph_result.get("competitor"),
            "strategy": graph_result.get("strategy"),
            "evaluator": graph_result.get("evaluation"),
        }.get(key.split("_")[0], {})
        # Map loosely by agent key
        if key == "market_researcher":
            output = graph_result.get("market")
        elif key == "competitor_analyst":
            output = graph_result.get("competitor")
        elif key == "strategy_writer":
            output = graph_result.get("strategy")
        elif key == "evaluator":
            output = graph_result.get("evaluation")
        db.add(
            WorkflowTask(
                tenant_id=wf.tenant_id,
                workflow_id=wf.id,
                agent_key=key,
                name=spec["name"],
                status="completed",
                input={"objective": wf.objective},
                output=output,
            )
        )

    await _persist_report_artifacts(db, wf, report)
    wf.report = report

    proposed = report.get("proposed_action")
    if proposed:
        decision = await trust.evaluate(
            db,
            tenant_id=wf.tenant_id,
            principal_id="agent:cmo_executive",
            principal_type="agent",
            workflow_id=wf.id,
            action=proposed["action"],
            resource_type=proposed["resource_type"],
            resource_id=proposed["resource_id"],
            payload=proposed.get("payload") or {},
            correlation_id=wf.id,
        )
        if decision["decision"] == "REQUIRES_APPROVAL":
            wf.status = WorkflowStatus.awaiting_action_approval
            db.add(
                WorkflowEvent(
                    tenant_id=wf.tenant_id,
                    workflow_id=wf.id,
                    event_type="action.approval_required",
                    payload={"approval_id": decision["approval_id"], "action": proposed["action"]},
                )
            )
        else:
            wf.status = WorkflowStatus.completed
    else:
        wf.status = WorkflowStatus.completed

    await metering.emit_metering(
        db,
        tenant_id=wf.tenant_id,
        event_name="workflow_run.executed",
        workflow_id=wf.id,
        meta={"status": wf.status.value},
    )
    if commit:
        await db.commit()
    else:
        await db.flush()
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == wf.id, Workflow.tenant_id == principal.tenant_id)
        .options(selectinload(Workflow.blueprint))
    )
    return result.scalar_one()


async def execute_sandbox_publish_after_approval(
    db: AsyncSession, principal: Principal, approval_id: str, commit: bool = True
) -> dict:
    from app.models.entities import Approval

    result = await db.execute(
        select(Approval).where(Approval.id == approval_id, Approval.tenant_id == principal.tenant_id)
    )
    approval = result.scalar_one_or_none()
    if approval is None:
        raise ValueError("approval_not_found")

    wf_result = await db.execute(
        select(Workflow).where(
            Workflow.id == approval.workflow_id, Workflow.tenant_id == principal.tenant_id
        )
    )
    wf = wf_result.scalar_one_or_none()
    if wf is None:
        raise ValueError("workflow_not_found")

    # Idempotency: if sandbox already executed for this approval, return prior receipt.
    prior = await db.execute(
        select(WorkflowEvent).where(
            WorkflowEvent.workflow_id == wf.id,
            WorkflowEvent.tenant_id == principal.tenant_id,
            WorkflowEvent.event_type == "action.sandbox_executed",
        )
    )
    existing_event = prior.scalars().first()
    if existing_event is not None:
        return existing_event.payload or {}

    await trust.recheck_before_execution(
        db,
        tenant_id=principal.tenant_id,
        approval_id=approval.id,
        action=approval.action,
        resource_type=approval.resource_type,
        resource_id=approval.resource_id,
        payload=approval.payload or {},
    )
    receipt = await sandbox_campaign_publish(
        tenant_id=principal.tenant_id,
        workflow_id=approval.workflow_id,
        payload=approval.payload or {},
    )
    wf.status = WorkflowStatus.completed
    db.add(
        WorkflowEvent(
            tenant_id=principal.tenant_id,
            workflow_id=wf.id,
            event_type="action.sandbox_executed",
            payload=receipt,
        )
    )
    await emit_audit(
        db,
        tenant_id=principal.tenant_id,
        actor_id=principal.user_id,
        event_type="execution.sandbox_campaign_publish",
        resource_type=approval.resource_type,
        resource_id=approval.resource_id,
        payload=receipt,
    )
    if commit:
        await db.commit()
    else:
        await db.flush()
    return receipt


async def list_workflows(db: AsyncSession, tenant_id: str) -> list[Workflow]:
    result = await db.execute(
        select(Workflow)
        .where(Workflow.tenant_id == tenant_id)
        .options(selectinload(Workflow.blueprint))
        .order_by(Workflow.created_at.desc())
    )
    return list(result.scalars().all())


async def get_workflow(db: AsyncSession, tenant_id: str, workflow_id: str) -> Workflow | None:
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.tenant_id == tenant_id)
        .options(selectinload(Workflow.blueprint))
    )
    return result.scalar_one_or_none()


async def overview(db: AsyncSession, tenant_id: str) -> dict:
    from app.models.entities import Approval

    workflows = await list_workflows(db, tenant_id)
    pending = await db.execute(
        select(func.count())
        .select_from(Approval)
        .where(Approval.tenant_id == tenant_id, Approval.status == ApprovalStatus.pending)
    )
    pending_count = int(pending.scalar_one())
    active = sum(
        1
        for w in workflows
        if w.status
        in {
            WorkflowStatus.running,
            WorkflowStatus.awaiting_blueprint_approval,
            WorkflowStatus.awaiting_action_approval,
        }
    )
    completed = sum(1 for w in workflows if w.status == WorkflowStatus.completed)
    return {
        "active_workflows": active,
        "pending_approvals": pending_count,
        "completed_workflows": completed,
        "open_exceptions": sum(1 for w in workflows if w.status == WorkflowStatus.failed),
        "recent_workflows": [workflow_to_dict(w) for w in workflows[:10]],
    }
