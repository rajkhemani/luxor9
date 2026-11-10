from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import (
    Approval,
    ApprovalDecision,
    ApprovalStatus,
    TrustDecision,
)
from app.services.audit import emit_audit

POLICY_VERSION = "v1"

# Actions allowed without human approval inside policy.
AUTO_ALLOW = {
    "public_research",
    "internal_read",
    "report_generation",
    "budget_recommendation",
    "blueprint_draft",
}

# Consequential actions — require exact-action approval.
REQUIRES_APPROVAL = {
    "campaign_publish",
    "customer_communication",
    "crm_modify",
    "budget_spend",
    "permission_change",
}


def fingerprint_action(action: str, resource_type: str, resource_id: str, payload: dict) -> str:
    normalized = {
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "payload": payload,
    }
    raw = json.dumps(normalized, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


async def evaluate(
    db: AsyncSession,
    *,
    tenant_id: str,
    principal_id: str,
    principal_type: str,
    workflow_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    payload: dict,
    correlation_id: str = "",
) -> dict:
    if principal_type == "agent" and action in REQUIRES_APPROVAL:
        # Agents never self-approve consequential actions.
        pass

    fp = fingerprint_action(action, resource_type, resource_id, payload)

    if action in AUTO_ALLOW:
        await emit_audit(
            db,
            tenant_id=tenant_id,
            actor_id=principal_id,
            event_type="trust.allow",
            resource_type=resource_type,
            resource_id=resource_id,
            correlation_id=correlation_id,
            payload={"action": action, "fingerprint": fp, "decision": TrustDecision.ALLOW.value},
        )
        return {
            "decision": TrustDecision.ALLOW.value,
            "reason_codes": ["auto_allow_policy"],
            "policy_version": POLICY_VERSION,
            "approval_id": None,
            "expires_at": None,
            "action_fingerprint": fp,
        }

    if action not in REQUIRES_APPROVAL and action not in AUTO_ALLOW:
        await emit_audit(
            db,
            tenant_id=tenant_id,
            actor_id=principal_id,
            event_type="trust.deny",
            resource_type=resource_type,
            resource_id=resource_id,
            correlation_id=correlation_id,
            payload={"action": action, "fingerprint": fp, "decision": TrustDecision.DENY.value},
        )
        return {
            "decision": TrustDecision.DENY.value,
            "reason_codes": ["unknown_action"],
            "policy_version": POLICY_VERSION,
            "approval_id": None,
            "expires_at": None,
            "action_fingerprint": fp,
        }

    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    approval = Approval(
        tenant_id=tenant_id,
        workflow_id=workflow_id,
        principal_id=principal_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        action_fingerprint=fp,
        policy_version=POLICY_VERSION,
        risk="high",
        payload=payload,
        status=ApprovalStatus.pending,
        expires_at=expires,
    )
    db.add(approval)
    await db.flush()
    await emit_audit(
        db,
        tenant_id=tenant_id,
        actor_id=principal_id,
        event_type="trust.requires_approval",
        resource_type=resource_type,
        resource_id=resource_id,
        correlation_id=correlation_id,
        payload={
            "action": action,
            "fingerprint": fp,
            "approval_id": approval.id,
            "decision": TrustDecision.REQUIRES_APPROVAL.value,
        },
    )
    return {
        "decision": TrustDecision.REQUIRES_APPROVAL.value,
        "reason_codes": ["consequential_action"],
        "policy_version": POLICY_VERSION,
        "approval_id": approval.id,
        "expires_at": expires,
        "action_fingerprint": fp,
    }


async def decide_approval(
    db: AsyncSession,
    *,
    tenant_id: str,
    approval_id: str,
    approver_user_id: str,
    decision: str,
    reason: str = "",
) -> Approval:
    # Row lock prevents concurrent double-approve on Postgres; SQLite ignores FOR UPDATE.
    result = await db.execute(
        select(Approval)
        .where(Approval.id == approval_id, Approval.tenant_id == tenant_id)
        .with_for_update()
    )
    approval = result.scalar_one_or_none()
    if approval is None:
        raise ValueError("approval_not_found")
    if approval.status != ApprovalStatus.pending:
        raise ValueError("approval_not_pending")
    expires = approval.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        approval.status = ApprovalStatus.expired
        await db.flush()
        raise ValueError("approval_expired")

    approval.status = (
        ApprovalStatus.approved if decision == "approve" else ApprovalStatus.rejected
    )
    db.add(
        ApprovalDecision(
            tenant_id=tenant_id,
            approval_id=approval.id,
            decided_by_user_id=approver_user_id,
            decision=decision,
            reason=reason,
        )
    )
    await emit_audit(
        db,
        tenant_id=tenant_id,
        actor_id=approver_user_id,
        event_type=f"approval.{decision}",
        resource_type="approval",
        resource_id=approval.id,
        payload={"workflow_id": approval.workflow_id, "action": approval.action},
    )
    await db.flush()
    return approval


async def recheck_before_execution(
    db: AsyncSession,
    *,
    tenant_id: str,
    approval_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    payload: dict,
) -> Approval:
    """Fail closed on expiry, revoke, mismatch, or fingerprint change."""
    result = await db.execute(
        select(Approval).where(Approval.id == approval_id, Approval.tenant_id == tenant_id)
    )
    approval = result.scalar_one_or_none()
    if approval is None:
        raise PermissionError("approval_missing")
    if approval.status == ApprovalStatus.revoked:
        raise PermissionError("approval_revoked")
    if approval.status == ApprovalStatus.expired:
        raise PermissionError("approval_expired")
    if approval.status != ApprovalStatus.approved:
        raise PermissionError("approval_not_approved")
    expires = approval.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        approval.status = ApprovalStatus.expired
        await db.flush()
        raise PermissionError("approval_expired")

    fp = fingerprint_action(action, resource_type, resource_id, payload)
    if (
        approval.action != action
        or approval.resource_type != resource_type
        or approval.resource_id != resource_id
        or approval.action_fingerprint != fp
    ):
        raise PermissionError("approval_mismatch")
    return approval
