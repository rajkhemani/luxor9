# LUXOR9 — Enterprise AI Operating System

**Luxor9 for Real-Estate Developers** — control intelligence, govern execution.

Chat / Copilot → blueprint approve/decline → hierarchical agents (Orchestrator → CMO → parallel specialists) → Control Tower evidence, approvals and audit.

## Product pillars

1. **Control Tower** — command, permissions, approvals, monitoring
2. **Intelligence Engine** — planning, orchestration, evidence, evaluation (+ AG-UI)
3. **AI Executive Workforce** — first pack: real-estate CMO

## Organised parallel layout

```text
apps/api/                 FastAPI — Trust, workflows, CMO graph, AG-UI /api/v1/agui/cmo
apps/control-tower/       Next.js — Tower + CopilotKit (/copilot) + classic chat
apps/mobile/              Flutter iOS/Android mirror
infrastructure/           Compose + Dockerfiles (API + UI + Postgres)
docs/                     PRD, ADRs, INFRASTRUCTURE, GTM, mobile
render.yaml               Pilot deploy (API + Tower + DB)
```

See [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) for the synced plane diagram and env matrix.

**Three buckets:** LangGraph = orchestration (1) · AG-UI/CopilotKit = connectivity (2) · CopilotKit Intelligence = production learning (3, Phase 2). They compose — see [ADR-0006](docs/adr/0006-three-bucket-agent-stack.md).

## Quick start (run planes in parallel)

```bash
make compose-up                 # Postgres
make api-install && make api-dev
make ui-install && make ui-dev  # other terminal — http://localhost:3000/copilot
# Mobile (Mac for iPhone): see docs/MOBILE.md
make demo-run                   # pitch seed
make sync-check                 # assert planes are wired
```

Copy `.env.example` to `.env` for Clerk later. Never commit secrets.

## GTM / deploy

- Pitch: [docs/GTM_RUNBOOK.md](docs/GTM_RUNBOOK.md)
- CopilotKit / OpenBot path: [docs/adr/0005-copilotkit-openbot-openduet-stack.md](docs/adr/0005-copilotkit-openbot-openduet-stack.md)
- Mobile: [docs/MOBILE.md](docs/MOBILE.md)
- Docker: `make compose-prod`
- Render: [render.yaml](render.yaml)

## Engineering rules

See [AGENTS.md](AGENTS.md), [docs/PRD.md](docs/PRD.md), [docs/TECHNICAL_BLUEPRINT.md](docs/TECHNICAL_BLUEPRINT.md).

**Human-on-the-Loop status:** [docs/project/MASTER_STATUS.md](docs/project/MASTER_STATUS.md)  
**Phase 00 discovery:** [docs/evidence/phase-reports/P00-discovery.md](docs/evidence/phase-reports/P00-discovery.md)

## License

Proprietary — all rights reserved unless otherwise noted.
