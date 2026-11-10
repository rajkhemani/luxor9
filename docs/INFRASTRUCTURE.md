# LUXOR9 — Organised parallel infrastructure

One modular monolith, four planes that ship together.

```
┌──────────────────────────── Surfaces ────────────────────────────┐
│  Control Tower (Next)     Copilot (/copilot)     Flutter mobile   │
│  Classic Chat             Workflows / Approvals  Tower mirror    │
└──────────────┬──────────────────────┬────────────────────────────┘
               │                      │
               ▼                      ▼
┌──── CopilotKit runtime ────┐   ┌──── REST / Trust API ───────────┐
│  /api/copilotkit  → AG-UI  │   │  /api/v1/*  workflows, chat,    │
│  HttpAgent luxor9_cmo      │   │  approvals, evidence, demo      │
└──────────────┬─────────────┘   └──────────────┬──────────────────┘
               │                                │
               ▼                                ▼
┌────────────────────── Intelligence + Governance (FastAPI) ───────┐
│  AG-UI /api/v1/agui/cmo     LangGraph CMO (parallel research)    │
│  Trust Engine               Approvals / Evidence / Audit         │
│  Postgres                   LangGraph checkpoint (prod)          │
└──────────────────────────────────────────────────────────────────┘
```

## Parallel structure (repo)

| Plane | Path | Role |
|---|---|---|
| API / engine | `apps/api` | FastAPI, Trust, CMO graph, AG-UI mount |
| Web surface | `apps/control-tower` | Tower + CopilotKit runtime + classic chat |
| Mobile surface | `apps/mobile` | Flutter iOS/Android mirror of Tower flows |
| Infra | `infrastructure/` | Compose, Dockerfiles |
| Deploy | `render.yaml` | API + Control Tower + Postgres |
| Docs | `docs/` | ADRs, GTM, mobile, computer-use |

## Local sync commands

```bash
make compose-up          # Postgres
make api-dev             # :8000 — REST + AG-UI
make ui-dev              # :3000 — Tower + /copilot
make mobile-get && cd apps/mobile && flutter run
make demo-run            # one-click pitch seed
make compose-prod        # full docker stack
```

## Env sync matrix

| Var | API | Control Tower | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✓ | — | async Postgres |
| `API_CORS_ORIGINS` | ✓ | — | include Tower origin |
| `CLERK_*` | ✓ | optional later | Hobby JWKS |
| `NEXT_PUBLIC_API_BASE_URL` | — | ✓ | REST base |
| `AGUI_CMO_URL` | — | ✓ | default `http://127.0.0.1:8000/api/v1/agui/cmo` |

## Authority

CopilotKit / OpenBot UI never authorizes side effects. Blueprint approve and campaign publish stay on Luxor9 Trust Engine (ADR-0005).
