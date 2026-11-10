# LUXOR9 — Organised parallel infrastructure

One modular monolith. **Three agent buckets** compose with **four deploy planes**.

## Three buckets (do not conflate)

```
 Bucket 1 ORCHESTRATION          Bucket 2 CONNECTIVITY           Bucket 3 LEARNING
 ┌─────────────────────┐         ┌──────────────────────────┐    ┌─────────────────────┐
 │ LangGraph CMO graph │  AG-UI  │ CopilotKit runtime/UI    │    │ CopilotKit          │
 │ parallel specialists│ ──────► │ stream · HITL · resume   │    │ Intelligence (P2)   │
 │ Trust side-effects  │         │ recursive tool visibility│    │ skills + datasets   │
 │ MCP tools (later)   │         │ text + state + gen UI    │    │ auditable scoped    │
 └─────────────────────┘         └──────────────────────────┘    └─────────────────────┘
```

See [ADR-0006](adr/0006-three-bucket-agent-stack.md). “LangGraph vs CopilotKit” is
bucket 1 vs bucket 2 — use both.

## Deploy planes (synced)

```
┌──────────────────────────── Surfaces ────────────────────────────┐
│  Control Tower (Next)     Copilot (/copilot)     Flutter mobile   │
│  Classic Chat             Workflows / Approvals  Tower mirror    │
└──────────────┬──────────────────────┬────────────────────────────┘
               │ bucket 2             │ REST / Trust
               ▼                      ▼
┌──── CopilotKit runtime ────┐   ┌──── REST / Trust API ───────────┐
│  /api/copilotkit  → AG-UI  │   │  /api/v1/*  workflows, chat,    │
│  HttpAgent luxor9_cmo      │   │  approvals, evidence, demo      │
└──────────────┬─────────────┘   └──────────────┬──────────────────┘
               │                                │
               ▼                                ▼
┌────────────── Intelligence + Governance (FastAPI) — bucket 1 ────┐
│  AG-UI /api/v1/agui/cmo     LangGraph CMO (parallel research)    │
│  Trust Engine               Approvals / Evidence / Audit         │
│  Postgres                   LangGraph checkpoint (prod resume)   │
└──────────────────────────────────────────────────────────────────┘
```

| Plane | Path | Role |
|---|---|---|
| API / engine | `apps/api` | Bucket 1 + AG-UI mount |
| Web surface | `apps/control-tower` | Bucket 2 runtime + Tower |
| Mobile surface | `apps/mobile` | Flutter mirror |
| Infra | `infrastructure/` | Compose, Dockerfiles |
| Deploy | `render.yaml` | API + Control Tower + Postgres |

## Local sync commands

```bash
make compose-up          # Postgres
make api-dev             # :8000 — REST + AG-UI
make ui-dev              # :3000 — Tower + /copilot
make mobile-get && cd apps/mobile && flutter run
make demo-run            # one-click pitch seed
make compose-prod        # full docker stack
make sync-check          # assert planes wired
```

## Env sync matrix

| Var | API | Control Tower | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✓ | — | async Postgres + checkpoint resume |
| `API_CORS_ORIGINS` | ✓ | — | include Tower origin |
| `CLERK_*` | ✓ | optional later | Hobby JWKS |
| `NEXT_PUBLIC_API_BASE_URL` | — | ✓ | REST base |
| `AGUI_CMO_URL` | — | ✓ | default `http://127.0.0.1:8000/api/v1/agui/cmo` |
| CopilotKit Intelligence keys | — | Phase 2 | Bucket 3 only |

## Authority

CopilotKit / OpenBot UI never authorizes side effects. Blueprint approve and
campaign publish stay on Luxor9 Trust Engine ([ADR-0005](adr/0005-copilotkit-openbot-openduet-stack.md),
[ADR-0006](adr/0006-three-bucket-agent-stack.md)).
