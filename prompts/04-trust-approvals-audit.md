# Prompt 04 — Trust Engine, approvals and audit ledger

Implement L9-005, L9-006 and L9-007 in small, independently tested changes.

Create a server-side policy decision interface returning ALLOW, DENY or REQUIRES_APPROVAL with reason codes and policy version.

Approval requirements:
- bind to tenant, authenticated approver, workflow, exact action, exact resource, normalized action fingerprint, policy version and expiry;
- derive approver identity from the authenticated session;
- enforce separation of duties where configured;
- reject expired, revoked, mismatched, replayed or stale approvals;
- invalidate approval on material payload changes;
- recheck policy immediately before the execution boundary.

Audit requirements:
- record request, policy decision, approval lifecycle and execution outcome;
- use append-only application semantics and restrict mutation permissions;
- record actor, tenant, workflow, timestamp, correlation ID and redacted metadata.

Build a fake/sandbox execution adapter only. Do not integrate live email, advertising, CRM write or payment APIs. Tests must prove a model-generated "approved" field cannot authorize an action, and duplicate/replayed requests cannot create duplicate side effects. Run and report all security tests.
