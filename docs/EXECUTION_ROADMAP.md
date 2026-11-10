# LUXOR9 Cursor Execution Roadmap

## Working agreement

Work one bounded ticket at a time. Every implementation begins with acceptance criteria and a plan; every behavior change has tests; every task ends with actual verification and a concise report.

## Phase 0 — discovery and architecture validation

- Inventory repository and local environment.
- Verify language/runtime versions and current upstream compatibility.
- Decide auth provider, API/frontend package structure and database migration approach.
- Write ADRs for consequential choices.
- Save a milestone plan.

**Exit:** approved architecture, dependency matrix, test strategy and clean Git baseline.

## Phase 1 — secure foundation

1. Repository scaffold and quality gates.
2. PostgreSQL and migrations.
3. Identity and tenant model.
4. RBAC and agent principal model.
5. Trust Engine policy interface.
6. Approval lifecycle and exact-action binding.
7. Audit event persistence.

**Exit:** tenant isolation tests, role tests, approval tamper/replay/expiry tests, migration tests and API smoke tests pass.

## Phase 2 — Control Tower foundation

- Login and tenant context.
- Overview screen.
- Agent directory.
- Workflow list/detail.
- Approval centre.
- Evidence detail view.

**Exit:** UI reads real backend data; backend enforces all permissions; no fake success states.

## Phase 3 — Intelligence Engine foundation

- Typed workflow contract.
- LangGraph workflow and checkpointing.
- Model/tool adapter interfaces.
- Context retrieval with tenant scoping.
- Observability and evaluation harness.

**Exit:** workflow survives worker restart, produces typed output and records trace/evaluation.

## Phase 4 — CMO vertical slice

- Development brief schema.
- Market research source adapter.
- Competitor research adapter.
- Evidence normalization and claim mapping.
- Conflict/unsupported-claim checks.
- Launch strategy/report assembler.

**Exit:** deterministic evaluation corpus passes agreed thresholds; reports link to sources; failures and uncertainty are visible.

## Phase 5 — pilot readiness

- Security review.
- Backup/restore test.
- Load and failure testing.
- Tenant onboarding checklist.
- Pilot acceptance criteria and baseline.
- Deployment and operations runbook.

**Exit:** repeatable demo and customer-approved pilot scope.

## Recommended ticket order

- L9-001 repository scaffold
- L9-002 database and migrations
- L9-003 identity and tenant isolation
- L9-004 RBAC and agent principals
- L9-005 Trust Engine authorization interface
- L9-006 approvals with exact-action binding
- L9-007 audit event ledger
- L9-008 Control Tower shell and overview
- L9-009 workflow contracts and persistence
- L9-010 LangGraph workflow baseline
- L9-011 evidence schema and ingestion
- L9-012 CMO market research workflow
- L9-013 competitor comparison and launch strategy
- L9-014 evaluation and reporting
- L9-015 security hardening and pilot packaging

## Release gate

No pilot release unless all critical tests pass, tenant isolation is demonstrated, external actions are blocked without current authorization, audit evidence is queryable and recovery/backups have been tested.
