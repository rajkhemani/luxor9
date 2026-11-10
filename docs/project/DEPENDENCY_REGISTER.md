# Dependency Register

## Runtime (observed)

| Layer | Package / system | Version / note | License risk | Decision |
|---|---|---|---|---|
| Language | Python | 3.12.3 | Low | Keep |
| Language | Node | 22.23.4 | Low | Keep |
| API | FastAPI | 0.162.x | Low | Keep (≥0.115 for CopilotKit) |
| UI | Next.js | ^15.0.3 | Low | Keep |
| Orchestration | LangGraph | via pyproject | Low | Bucket 1 |
| Connectivity | ag-ui-langgraph + @copilotkit/* v2 | installed | Low | Bucket 2 — pin carefully |
| Auth | Clerk | Hobby planned | Low | JWKS pending |
| DB | PostgreSQL 16 (Compose) | local/prod path | Low | SoR |
| DB (dev tests) | SQLite/aiosqlite | tests/dev | Low | Not production SoR |
| Queue | Redis/Celery | not installed | — | Deferred |
| Harness | Deep Agents | not installed | — | Deferred |
| Runtime | HERMES | stub | — | Deferred |
| Learning | CopilotKit Intelligence | not wired | — | Phase 2 / bucket 3 |

## Compatibility cites

- [ag-ui-langgraph on PyPI](https://pypi.org/project/ag-ui-langgraph/) — Python ≥3.10,<3.15; FastAPI extra; LangGraph <2  
- [copilotkit on PyPI](https://pypi.org/project/copilotkit/) — FastAPI ≥0.115,<1; LangGraph ≥0.3.25,<2  
- [CopilotKit onboarding prompt](https://copilotkit.ai/onboarding-prompts/bba95955d7ea) — official onboard CLI (awaiting founder yes)
