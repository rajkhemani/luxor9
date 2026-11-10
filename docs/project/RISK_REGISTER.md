# Risk Register

| ID | Risk | Severity | Likelihood | Status | Mitigation |
|---|---|---|---|---|---|
| R-001 | Demo auth mistaken for production security | High | Medium | Open | Fail-closed outside development; L9-010 JWKS |
| R-002 | Synthetic research presented as verified intel | High | Medium | Open | UNVERIFIED flags; L9-013/014 gates |
| R-003 | Dual paths (REST chat vs AG-UI) diverge business logic | Medium | Medium | Watch | Shared workflow/Trust services only |
| R-004 | AG-UI resume incomplete without Postgres checkpointer | Medium | High | Open | L9-011 |
| R-005 | CopilotKit dependency/API churn (v2) | Medium | Medium | Watch | Pin versions; thin adapter |
| R-006 | Scope explosion (C-suite, Celery, Intelligence) | Medium | High | Watch | HOTL phase gates; DEFERRED register |
| R-007 | Sibling monorepo merge temptation | Medium | Medium | Watch | Inventory-only without ADR |
| R-008 | Production deploy without RED approval | Critical | Low | Controlled | Explicit founder gate Phase 13 |
