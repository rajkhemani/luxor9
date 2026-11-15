# Phase 1 Implementation Plan — Secure Foundation

**Generated:** 2026-11-15  
**Source:** `docs/EXECUTION_ROADMAP.md`  
**Status:** Ready for Implementation

## 1. Context & Constraints

Phase 1 builds the secure foundation for LUXOR9 per the approved HOTL meta-prompt and architecture baseline:

- **Modular monolith** (ADR-0001) — single FastAPI application with explicit domain modules.
- **PostgreSQL** as the system of record (no microservices).
- **Thin RBAC** (ADR-0004) — human roles: `admin`, `member`, `approver`; agent principals with narrow allowlists.
- **Trust Engine authority** — all consequential actions require approval bound to tenant, principal, workflow, action, resource, policy version and expiry.
- **Fail closed** outside development.

**Out of scope:** Redis/Celery, Deep Agents, HERMES adapter, CopilotKit Intelligence (bucket 3), Playwright E2E, live research adapters.

**Existing codebase:** Phase 0 foundation is complete (16 tests passing, AG-UI wired, blueprints work). This plan adds identity/tenant/RBAC/Trust/approvals/audit on top of that slice.

## 2. Implementation Tasks (Ordered)

### L9-001: Database Migrations & Entities (Phase 1.2, 1.3, 1.4, 1.7)

**Status:** Schema exists in `apps/api/app/models/entities.py` (SQLAlchemy models). **Missing:** Alembic migration files.

**Tasks:**
1. Create Alembic migration for all Phase 1 tables: `tenants`, `users`, `memberships`, `workflows`, `blueprints`, `workflow_tasks`, `workflow_events`, `approvals`, `approval_decisions`, `audit_events`, `metering_events`.
2. Ensure migration runs on clean PostgreSQL (Compose service `postgres`).
3. Add indexes for tenant-scoped queries: `ix_workflows_tenant_status`, `ix_approvals_tenant_status`, `ix_audit_tenant_created`, `ix_metering_tenant_created`.
4. Verify foreign keys and unique constraints (`uq_membership_tenant_user`, `uq_agent_tenant_key`).

**Acceptance:** `alembic upgrade head` creates schema; `alembic downgrade base` cleanly removes it.

**Dependencies:** None.

**Risk:** Low. Schema is defined; Alembic setup is standard.

---

### L9-002: Identity & Tenant Model (Phase 1.3)

**Status:** Demo auth path exists in `apps/api/app/auth.py` (`get_principal`, `_ensure_demo_principal`). **Missing:** Clerk JWKS verification for production.

**Tasks:**
1. Implement Clerk JWKS verification in `apps/api/app/auth.py`:
   - Add `clerk_jwks_url` setting to `apps/api/app/config.py`.
   - Verify JWT signature against Clerk JWKS endpoint.
   - Extract `clerk_user_id`, `email`, `display_name` from verified token.
   - Upsert user and membership on first login (tenant = "luxor9-re-demo" for MVP).
2. Keep demo auth (`X-Demo-User`) **only** when `ENVIRONMENT=development` or `AUTH_DISABLED_FOR_TESTS=true`.
3. Add unit tests for JWKS verification (mock JWKS endpoint).
4. Update `.env.example` with `CLERK_JWKS_URL`.

**Acceptance:** 
- Unverified Bearer tokens rejected (501) when JWKS missing.
- Verified Clerk tokens create/update users in PostgreSQL.
- Demo auth still works in development.

**Dependencies:** Clerk account and JWKS URL (founder to provide).

**Risk:** Amber. JWKS verification is security-critical; test thoroughly.

**References:** ADR-0004, `docs/architecture/SECURITY_ARCHITECTURE.md`.

---

### L9-003: RBAC & Agent Principals (Phase 1.4)

**Status:** Thin RBAC implemented in `apps/api/app/auth.py` (`require_roles`). **Missing:** Agent principal model and tool allowlists.

**Tasks:**
1. Extend `Principal` dataclass to include `principal_type: Literal["user", "agent"]`.
2. Add agent principal authentication path (machine identity, e.g., API key or mTLS):
   - Agents authenticate with narrow tool allowlists (`agent_definitions.tool_allowlist`).
   - Agents cannot approve their own actions (enforce in Trust Engine).
3. Update `require_roles` to handle agent principals.
4. Add tests for agent principal restrictions (e.g., agent cannot call `approvals/{id}/approve`).

**Acceptance:**
- Agent principals authenticate separately from humans.
- Agents are blocked from approval endpoints.
- Tool allowlists are enforced (stub enforcement; full tool gating is Phase 3).

**Dependencies:** L9-002.

**Risk:** Amber. Agent identity model needs validation.

**References:** ADR-0004, `docs/PRD.md` §8.

---

### L9-004: Trust Engine Authorization Interface (Phase 1.5)

**Status:** Trust Engine exists in `apps/api/app/services/trust.py`. **Missing:** Policy version management and tenant-scoped policy evaluation.

**Tasks:**
1. Formalize policy versioning:
   - Store policy versions in `policy_version` field (currently hardcoded "v1").
   - Add `policy_versions` table (optional for MVP; can be config-based).
2. Ensure all Trust decisions are tenant-scoped (already implemented).
3. Add audit events for all Trust decisions (already implemented in `emit_audit`).
4. Write unit tests for policy evaluation (allow, deny, requires_approval).

**Acceptance:**
- Policy version is recorded in approvals and audit events.
- Tenant isolation is enforced (tenant A cannot access tenant B's approvals).

**Dependencies:** L9-001.

**Risk:** Low. Core logic exists; minor enhancements needed.

**References:** ADR-0001, `docs/architecture/SECURITY_ARCHITECTURE.md`.

---

### L9-005: Approval Lifecycle & Exact-Action Binding (Phase 1.6)

**Status:** Approval lifecycle implemented in `apps/api/app/services/trust.py` (`evaluate`, `decide_approval`, `recheck_before_execution`). **Missing:** Revocation endpoint.

**Tasks:**
1. Add `POST /api/v1/approvals/{approval_id}/revoke` endpoint:
   - Allow `admin` or `approver` to revoke pending/approved approvals.
   - Set status to `revoked` and emit audit event.
2. Ensure approval expiry is enforced (already implemented).
3. Test approval replay protection (fingerprint mismatch blocks execution).

**Acceptance:**
- Approval can be revoked before execution.
- Revoked approvals block execution (403).
- Expired approvals block execution (403).
- Fingerprint mismatch blocks execution (403).

**Dependencies:** L9-004.

**Risk:** Low. Core logic exists; revocation is a simple addition.

**References:** `docs/PRD.md` §9, `docs/architecture/SECURITY_ARCHITECTURE.md`.

---

### L9-006: Audit Event Persistence (Phase 1.7)

**Status:** Audit events implemented in `apps/api/app/services/audit.py` (`emit_audit`). **Missing:** Audit query API and retention policy.

**Tasks:**
1. Add `GET /api/v1/audit` endpoint to query audit events (filter by tenant, actor, event_type, date range).
2. Ensure audit events are immutable (no update/delete endpoints).
3. Document retention policy (e.g., 90 days hot, 1 year cold; Phase 5 backup/restore).

**Acceptance:**
- Audit events are queryable by authorized users (admin, auditor role).
- Audit log is append-only.

**Dependencies:** L9-001.

**Risk:** Low. Table and emit function exist; query API is straightforward.

**References:** `docs/PRD.md` §10.

---

### L9-007: Tenant Isolation Tests (Phase 1 Exit Criteria)

**Status:** Basic tenant isolation test exists in `apps/api/tests/test_tenant_isolation.py`. **Missing:** Comprehensive cross-tenant access tests.

**Tasks:**
1. Write tests for all tenant-scoped endpoints:
   - Workflows, blueprints, approvals, audit events, evidence, metering.
2. Test that changing `tenant_id` in request is ignored (server resolves from principal).
3. Test that users cannot access other tenants' data (403 or 404).

**Acceptance:**
- 100% of tenant-scoped endpoints have cross-tenant access tests.
- All tests pass.

**Dependencies:** L9-002 through L9-006.

**Risk:** Low. Test coverage extension.

**References:** `docs/quality/TEST_STRATEGY.md`, `docs/quality/SECURITY_TEST_RESULTS.md`.

---

### L9-008: RBAC Tests (Phase 1 Exit Criteria)

**Status:** Basic RBAC test exists in `apps/api/tests/test_rbac.py`. **Missing:** Comprehensive role-based access tests.

**Tasks:**
1. Test `admin`, `member`, `approver` role permissions:
   - `admin` can do everything.
   - `approver` can approve/reject but not manage users.
   - `member` can create workflows but not approve.
2. Test agent principal restrictions (cannot approve, restricted tool allowlist).

**Acceptance:**
- Role permissions are enforced (403 for insufficient role).
- Agent principals are blocked from approval endpoints.

**Dependencies:** L9-003.

**Risk:** Low. Test coverage extension.

**References:** ADR-0004, `docs/PRD.md` §8.

---

### L9-009: Approval Tamper/Replay/Expiry Tests (Phase 1 Exit Criteria)

**Status:** Basic approval tests exist in `apps/api/tests/test_trust_approvals.py`. **Missing:** Tamper and replay scenarios.

**Tasks:**
1. Test approval fingerprint mismatch (change payload after approval → execution blocked).
2. Test approval expiry (expire approval → execution blocked).
3. Test approval revocation (revoke approval → execution blocked).
4. Test double-approve (second approve → 400).

**Acceptance:**
- All tamper/replay/expiry scenarios are covered.
- Tests pass.

**Dependencies:** L9-005.

**Risk:** Low. Core logic exists; test extension.

**References:** `docs/PRD.md` §12, `docs/quality/SECURITY_TEST_RESULTS.md`.

---

### L9-010: Migration Tests & API Smoke Tests (Phase 1 Exit Criteria)

**Status:** Basic API tests exist (16 passing). **Missing:** Migration up/down tests and full API smoke tests.

**Tasks:**
1. Test Alembic migration up/down on clean PostgreSQL.
2. Write API smoke tests for all endpoints (health, auth, workflows, approvals, audit, etc.).
3. Ensure CORS allowlist is tested (already exists in `test_cors_origins.py`).

**Acceptance:**
- Migration up/down succeeds.
- All endpoints respond correctly (200, 401, 403, 404 as appropriate).

**Dependencies:** L9-001 through L9-009.

**Risk:** Low. Test coverage extension.

**References:** `docs/quality/TEST_STRATEGY.md`.

---

## 3. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Clerk JWKS integration complexity | Test with mock JWKS endpoint; founder to provide test Clerk account. |
| Agent principal model unclear | Defer full agent tool gating to Phase 3; MVP only needs identity separation. |
| Tenant isolation gaps | Comprehensive cross-tenant tests; code review. |
| Approval fingerprint edge cases | Test with various payload types (nested objects, arrays, null). |

## 4. Validation Plan

1. **Unit/Integration Tests:** `pytest -q` in `apps/api` (target: 30+ tests passing).
2. **Static Checks:** `ruff check .` (API), `tsc --noEmit` (Tower, if touched).
3. **Security Tests:** Cross-tenant access, RBAC, approval tamper/replay/expiry.
4. **Migration Test:** `alembic upgrade head` on clean DB, then `alembic downgrade base`.

## 5. Open Questions (Resolve Before Implementation)

1. **Clerk JWKS URL:** Does the founder have a Clerk account with JWKS endpoint? (Needed for L9-002)
2. **Agent Authentication:** How should agents authenticate? API key, mTLS, or JWT? (Deferred; stub for now)
3. **Policy Versioning:** Should policy versions be in a database table or config-based? (Config-based for MVP)

## 6. Completion Report (Template)

After implementation, report:
1. Files changed.
2. Behavior added or changed.
3. Tests and commands run, with results.
4. Known limitations or skipped checks.
5. Migration, security, or operational risk.
6. Exact next task recommended (e.g., L9-011 Postgres checkpointer resume).

---

**Plan prepared by:** Kilo Code (Planning Agent)  
**Ready for:** Implementation-capable agent (e.g., Kilo Code in Code mode)