# Test Strategy

## Layers

1. **API unit/integration** — Pytest (`make api-test`); Trust, tenancy, chat, CORS, AG-UI status.  
2. **Static** — Ruff (API), `tsc --noEmit` (Tower).  
3. **Mobile smoke** — Flutter widget/theme tests.  
4. **E2E (planned)** — Playwright: objective → blueprint → approve → Tower evidence.  
5. **Eval corpus (planned)** — Unsupported-claim rate thresholds on fixtures.  
6. **Security (planned Phase 12)** — Cross-tenant, authz bypass, injection.

## Rules

- RED → GREEN → REFACTOR for behavior changes.  
- VERIFIED requires executed tests + evidence reference.  
- Do not mark ACCEPTED without founder/criteria satisfaction.  
- Never claim tests passed without running them.
