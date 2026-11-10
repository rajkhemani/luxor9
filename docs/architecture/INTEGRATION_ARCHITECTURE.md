# Integration Architecture (baseline)

| Integration | Status | Boundary |
|---|---|---|
| CopilotKit + AG-UI | Thin wired | Connectivity only; no Trust authority |
| Clerk | Config hooks | AuthN; JWKS verify pending |
| LangGraph | Wired | Workflow state owner |
| Research web sources | Stub/synthetic | Adapter interface ready |
| Sandbox campaign publish | Stub | Trust-gated |
| HERMES | Stub adapter | No policy authority |
| Deep Agents | Not installed | Optional spike later |
| Redis/Celery | Not installed | Deferred |
| LangSmith | Not wired | Optional eval later |
| Render / Docker | Draft | Pilot packaging; RED for prod |

New external integrations = **Amber** approval.
