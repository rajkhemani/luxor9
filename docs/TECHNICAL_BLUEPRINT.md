# LUXOR9 — Technical Engineering Blueprint

**Version:** 1.0 | **Status:** Proposed baseline

## 1. Architectural stance

Build a **modular monolith** first, with background workers that can scale separately. Keep domain boundaries and contracts clean. Do not start with microservices, Kubernetes or a large agent fleet.

The platform has four logical planes:

1. **Control Plane:** identity, tenants, roles, policies, workflow administration and approvals.
2. **Intelligence Plane:** intent, context, planning, orchestration, memory and evaluation.
3. **Execution Plane:** authorized tools, integrations, document processing and external side effects.
4. **Evidence Plane:** sources, claims, verification, approvals, execution and audit provenance.

## 2. Logical architecture

```text
Browser: Control Tower (React / TypeScript)
          | typed API + optional AG-UI adapter
          v
Backend API (FastAPI modular monolith)
  |-- Identity / Tenant / RBAC
  |-- Trust Engine / Approval / Audit
  |-- Workflow API / Agent Registry
  |-- Evidence / Reporting / Evaluation
          |
          v
Intelligence Engine
  |-- LangGraph durable workflow
  |-- Planner and task decomposition
  |-- CMO specialist capability
  |-- Model / tool / runtime adapters
          |
          v
Execution boundary
  |-- policy recheck
  |-- idempotency + action fingerprint
  |-- sandboxed/authorized tool adapter
          |
          v
Customer data plane: PostgreSQL, object storage, approved APIs

Supporting: Redis/worker queue, OpenTelemetry, evaluation harness
```

## 3. Stack baseline

- Frontend: React + TypeScript; Next.js if server-side rendering/routing is needed.
- UI: Tailwind CSS and shadcn/ui, with accessible components.
- Backend: Python + FastAPI.
- Contracts: Pydantic.
- Database: PostgreSQL.
- ORM/migrations: SQLAlchemy + Alembic.
- Vector retrieval: pgvector only when semantic retrieval is required.
- Workflow state: LangGraph with durable PostgreSQL-backed checkpoints.
- Background jobs: Redis + Celery only for jobs not already owned by the workflow engine; avoid duplicate queue semantics.
- Agent harness: Deep Agents as an optional delegation layer after a compatibility spike.
- Runtime: HERMES behind a Luxor9 adapter; it has no policy authority.
- Agent UI: evaluate CopilotKit and AG-UI with a small compatibility spike; isolate behind a frontend adapter. Do not block the MVP on it.
- Observability: OpenTelemetry.
- Evaluation: custom deterministic checks plus LangSmith if the chosen deployment/data policy permits it.
- Tests: Pytest, frontend unit tests, Playwright end-to-end.
- Packaging: Docker Compose for local development; CI with GitHub Actions.

Before installing dependencies, Cursor must check current official documentation, Python/Node compatibility, licenses and supported integration versions. Do not hardcode stale package versions from this document.

## 4. Service/module boundaries

Keep these as modules in the API application initially:

- identity
- tenants
- users_roles_permissions
- trust_engine
- approvals
- audit
- agents
- workflows
- intelligence
- evidence
- documents
- reporting
- evaluations
- integrations
- usage_observability

Workers may be separate processes. Extract a service only when independent scaling, deployment, security or ownership makes the operational cost worthwhile.

## 5. Identity, tenancy and authorization

- Use an established OIDC/OAuth-compatible identity provider or a well-maintained auth library; do not invent password/session cryptography.
- Resolve tenant membership and role assignments on the server.
- Every tenant-owned record includes `tenant_id`.
- Repository/service methods require explicit tenant context.
- Consider PostgreSQL row-level security as defense in depth, not as a substitute for application authorization.
- Agent principals are separate machine identities with narrow scopes.
- Frontend permissions improve UX only; backend policy is authoritative.

## 6. Trust Engine

### Authorization request

Fields: tenant ID, authenticated principal ID, principal type, workflow ID, action, resource type/ID, risk context, requested tool, policy version and correlation ID.

### Decision

`ALLOW`, `DENY` or `REQUIRES_APPROVAL`, plus reason codes, evaluated policy version and expiry.

### Approval binding

Approval is bound to tenant, principal, workflow, exact action, exact resource, normalized action fingerprint, policy version, approver and expiration. A material payload change invalidates approval.

### Execution sequence

1. Agent proposes a typed action; it does not execute it directly.
2. Backend validates payload and identity.
3. Trust Engine evaluates policy.
4. If approval required, create pending approval and pause workflow.
5. Authorized human approves/rejects in Control Tower.
6. On resume, recheck approver authority, approval validity and policy.
7. Execution service evaluates authorization immediately before side effect.
8. Use idempotency key/action fingerprint to prevent duplicate execution.
9. Record provider response, outcome, trace and audit event.

No model-generated string such as "approved" is accepted as an authorization token.

## 7. Workflow and agent model

LangGraph owns durable business workflow state and transitions. The CMO is a capability package, not a separate microservice in MVP.

Potential nodes:
- validate_request
- resolve_context
- create_plan
- plan_policy_check
- market_research
- competitor_research
- normalize_evidence
- detect_conflicts
- generate_strategy
- evaluate_output
- assemble_report
- wait_for_human_approval (only when action requires it)
- execute_authorized_action
- verify_execution
- finalize

Long-running graph state must be checkpointed. Retry only transient, idempotent steps. Never automatically retry a non-idempotent external action unless the provider supports a reliable idempotency mechanism and the authorization is still valid.

## 8. Agent contracts

Each specialist has:
- stable `agent_id` and version;
- declared capability and allowed input schema;
- explicit tool allowlist;
- output schema;
- context access policy;
- evaluation suite;
- time/token/cost limits;
- escalation and failure behavior.

Agents cannot modify their own role, tool scopes or policy. All tool calls go through the execution boundary.

## 9. Evidence model

Store source metadata separately from claims and extracted observations.

A source record should include:
- tenant ID;
- source type and canonical URI;
- title/publisher where known;
- collected timestamp;
- publication/update timestamp where known;
- content hash and extractor version;
- license/access classification;
- source status.

An evidence item is a bounded extracted passage or structured observation with locator/page/section metadata. A claim record contains normalized claim text, claim type, verification status, confidence/uncertainty and workflow provenance. A join table associates claims with supporting or contradicting evidence.

Statuses: `UNVERIFIED`, `VERIFIED`, `CONFLICTING`, `EXPIRED`, `REJECTED`. Do not conflate source reliability with claim confidence.

## 10. Suggested relational model

Core tables:

- tenants
- users / identities
- memberships
- roles / permissions / role_permissions / user_roles
- agent_definitions / agent_versions
- workflows / workflow_tasks / workflow_events
- approvals / approval_decisions
- policies / policy_versions
- execution_requests / execution_results
- audit_events
- evidence_sources / evidence_items
- claims / claim_evidence
- documents
- memories / memory_provenance
- evaluations / evaluation_cases / evaluation_runs
- model_usage

Every tenant-owned table requires `tenant_id`, suitable indexes and tenant-scoped unique constraints. Use UUIDs or another non-guessable identifier, but do not mistake unguessable IDs for authorization.

## 11. API surface (initial)

Base `/api/v1`.

- `GET /me`
- `GET /tenants/current`
- `GET/POST /users`
- `GET /roles`
- `GET /agents`
- `POST /workflows`
- `GET /workflows`
- `GET /workflows/{workflow_id}`
- `POST /workflows/{workflow_id}/cancel`
- `GET /approvals`
- `GET /approvals/{approval_id}`
- `POST /approvals/{approval_id}/approve`
- `POST /approvals/{approval_id}/reject`
- `GET /workflows/{workflow_id}/evidence`
- `GET /workflows/{workflow_id}/report`

All mutations require authentication, server-side authorization, request validation, idempotency where applicable and trace IDs. Use pagination and stable error schemas. Approval endpoints must derive the acting approver from authentication, never from a request-supplied user ID.

## 12. Frontend modules

- Overview
- Command / workflow creation
- Workforce / agent registry
- Workflow monitor
- Approval centre
- Evidence ledger
- Reports
- Analytics
- Integrations
- Tenant settings

Visual direction: institutional, high-contrast obsidian and mineral ivory with restrained Luxor Signal cyan. Prioritize data density, clarity, accessibility, responsive layout and explicit risk/approval states. Do not make a generic chatbot dashboard.

## 13. Repository structure (proposed)

```text
apps/
  control-tower/       # React/Next.js application
  api/                 # FastAPI modular monolith
intelligence/
  graph/ planner/ memory/ evaluation/ routing/
executives/
  base/ cmo/
governance/
  trust_engine/ policies/ approvals/ audit/
runtime/
  adapters/ hermes/
integrations/
  research/ documents/ crm/ marketing/
shared/
  contracts/ schemas/ events/
infrastructure/
  docker/ migrations/ monitoring/
tests/
  unit/ integration/ security/ workflow/ e2e/
docs/
  PRD.md TECHNICAL_BLUEPRINT.md adr/ plans/
.cursor/rules/
AGENTS.md
```

Cursor may adjust this layout after a reviewed architecture plan, but must document deviations in an ADR.

## 14. Testing strategy

- Unit: policy decisions, typed schemas, claim association, state transitions.
- Integration: PostgreSQL transactions, tenant isolation, checkpoint persistence, approval lifecycle, adapters.
- Security: cross-tenant access, privilege escalation, approval replay/expiry/revocation, prompt injection, secret leakage, unsafe document content.
- Workflow: research success, partial evidence, conflicting evidence, provider outage, cancellation, resume, retry.
- E2E: objective → workflow → evidence → report → approval gate → authorized sandbox action → audit result.

Critical invariant tests must prove that model output cannot authorize an action and that changed/expired/revoked approval blocks execution.

## 15. Observability

Record structured events with tenant-safe identifiers, workflow/task IDs, agent version, model/provider, latency, retry count, token/cost usage where available, policy decision and outcome. Redact credentials, secrets and unnecessary personal data. Use trace correlation across API, graph nodes, tools and workers.

## 16. Deployment

Local: Docker Compose for PostgreSQL and Redis; app processes may run natively for fast iteration.

Pilot: isolated tenant configuration, encrypted secrets, backups, controlled ingress, monitoring, migration discipline and recovery documentation.

Enterprise: support customer-controlled data plane and deployment options. Do not assume customer documents can be copied into a central shared environment.

## 17. Decisions requiring an ADR or spike

- Authentication provider and session architecture.
- CopilotKit/AG-UI compatibility with selected FastAPI/LangGraph versions.
- Whether Deep Agents adds demonstrable value over a simple LangGraph specialist graph.
- HERMES adapter contract and isolation model.
- Durable checkpoint implementation and retention policy.
- Object storage for uploaded files and extracted artifacts.
- RLS strategy and migration/connection-pool behavior.
- Provider/model routing and customer data residency constraints.
