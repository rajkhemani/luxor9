# Security Architecture (baseline)

## Principles

- Server resolves identity, tenant, role.  
- Model output is untrusted data, never an authorization token.  
- Consequential side effects: Trust Engine recheck → approval binding → sandbox/authorized adapter.  
- Fail closed outside development.

## Current controls

- Clerk JWKS verification (RS256, issuer, azp/aud allowlist, exp, key rotation cache).  
- Control Tower ClerkProvider + middleware when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set.  
- Demo principal via `X-Demo-User` **only** when development/tests allow.  
- Production rejects demo headers and fails closed without JWKS/issuer.  
- AG-UI agent endpoints require principal resolution.  
- Self-approval forbidden on Trust Engine decisions.  
- Blueprint approve role-gated (admin/approver).  
- Approval exact-action binding + atomicity tests.  
- CORS allowlist includes `localhost` and `127.0.0.1` Tower origins.

## Open gaps (must close before external pilot)

- Org/branch multi-tenant model + expanded RBAC (Phase C/D)  
- MFA upgrade gate (Hobby → Pro) before consequential external approvers  
- Prompt-injection / data-leakage test suite (Phase 12)  
- Rate limiting, security headers, RLS, CI secret/dep scanning  
- Production secrets management verification  

## RED boundaries

No production deploy, customer data exposure, spend, or external publish without explicit founder approval.
