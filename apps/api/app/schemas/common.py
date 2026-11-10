from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    version: str
    service: str = "luxor9-api"


class MeResponse(BaseModel):
    user_id: str
    clerk_user_id: str
    email: str
    display_name: str
    tenant_id: str
    tenant_name: str
    role: str


class WorkflowCreateRequest(BaseModel):
    objective: str = Field(min_length=3)
    context: dict[str, Any] = Field(default_factory=dict)
    pack: str = "cmo_re"


class BlueprintOut(BaseModel):
    id: str
    workflow_id: str
    status: str
    title: str
    summary: str
    plan: dict[str, Any]


class WorkflowOut(BaseModel):
    id: str
    tenant_id: str
    objective: str
    status: str
    pack: str
    context: dict[str, Any]
    report: dict[str, Any] | None = None
    blueprint: BlueprintOut | None = None
    created_at: datetime | None = None


class BlueprintDecisionRequest(BaseModel):
    decision: str = Field(pattern="^(approve|decline)$")
    reason: str = ""


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1)
    workflow_id: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)


class ChatMessageResponse(BaseModel):
    reply: str
    workflow: WorkflowOut
    awaiting: str | None = None


class ApprovalOut(BaseModel):
    id: str
    tenant_id: str
    workflow_id: str
    action: str
    resource_type: str
    resource_id: str
    action_fingerprint: str
    status: str
    risk: str
    payload: dict[str, Any]
    expires_at: datetime
    policy_version: str


class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")
    reason: str = ""


class TrustEvaluateRequest(BaseModel):
    workflow_id: str
    action: str
    resource_type: str
    resource_id: str
    payload: dict[str, Any] = Field(default_factory=dict)
    requested_tool: str | None = None
    correlation_id: str = ""


class TrustEvaluateResponse(BaseModel):
    decision: str
    reason_codes: list[str]
    policy_version: str
    approval_id: str | None = None
    expires_at: datetime | None = None


class EvidenceOut(BaseModel):
    source_id: str
    title: str
    canonical_uri: str
    source_type: str
    content_hash: str
    collected_at: datetime | None = None
    excerpts: list[str] = Field(default_factory=list)


class ClaimOut(BaseModel):
    id: str
    claim_text: str
    claim_type: str
    status: str
    confidence: float
    uncertainty_notes: str = ""


class AuditEventOut(BaseModel):
    id: str
    event_type: str
    actor_id: str
    resource_type: str
    resource_id: str
    payload: dict[str, Any]
    created_at: datetime | None = None


class MeteringEventOut(BaseModel):
    id: str
    event_name: str
    workflow_id: str | None
    units: int
    meta: dict[str, Any]
    created_at: datetime | None = None


class OverviewResponse(BaseModel):
    active_workflows: int
    pending_approvals: int
    completed_workflows: int
    open_exceptions: int
    recent_workflows: list[WorkflowOut]
