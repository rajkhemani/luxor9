# Security Architecture (baseline)

## Principles

- Server resolves identity, tenant, role.  
- Model output is untrusted data, never an authorization token.  
- Consequential side effects: Trust Engine recheck → approval binding → sandbox/authorized adapter.  
- Fail closed outside development.

## Current controls

- Demo principal via `X-Demo-User` **only** when development/tests allow.  
- Unverified Bearer rejected when Clerk JWKS missing.  
- Blueprint approve role-gated (admin/approver).  
- Approval exact-action binding + atomicity tests.  
- CORS allowlist includes `localhost` and `127.0.0.1` Tower origins.

## Open gaps (must close before external pilot)

- Clerk JWKS verification (L9-010)  
- MFA upgrade gate (Hobby → Pro) before consequential external approvers  
- Prompt-injection / data-leakage test suite (Phase 12)  
- Production secrets management verification  

## RED boundaries

No production deploy, customer data exposure, spend, or external publish without explicit founder approval.
