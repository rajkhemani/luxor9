# Prompt 06 — Release readiness review

Do not add new product scope. Audit the implemented milestone against `docs/PRD.md`, `docs/TECHNICAL_BLUEPRINT.md` and the approved plan.

Review:
- tenant isolation and authorization;
- approval binding, expiry, revocation and replay resistance;
- idempotency and side-effect boundaries;
- secrets, PII and log redaction;
- schema migration and restore readiness;
- workflow restart/recovery behavior;
- evidence provenance and unsupported claim handling;
- error/loading/empty states in Control Tower;
- dependency health and license notes;
- lint, type checks, unit, integration, security and E2E tests.

Run the relevant checks. Do not claim checks passed unless executed. Produce a severity-ranked findings report. Critical or high-severity findings block release. Do not deploy to production, connect real customer data or perform external actions.
