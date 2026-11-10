# ADR-0004: Clerk Hobby and Thin Human RBAC

- **Status:** Accepted
- **Date:** 2026-11-10

## Context

MVP needs hosted OIDC without inventing auth crypto. Clerk is available and has a free Hobby tier. Full PRD role matrix is too heavy for a solo-founder MVP. Hobby lacks MFA.

## Decision

- Use **Clerk Hobby** for human authentication in MVP.
- Human roles: `admin`, `member`, `approver` only.
- Agent principals are separate machine identities with narrow tool allowlists.
- Upgrade to Clerk Pro + MFA before any external pilot where humans approve consequential side effects.

## Consequences

Positive: free to build; RBAC stays testable; agent hierarchy carries most “org chart” complexity.

Trade-offs: MFA gap until paid upgrade; document the gate in pilot packaging.
