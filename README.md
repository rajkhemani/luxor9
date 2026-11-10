# LUXOR9 — Enterprise AI Operating System

**Luxor9 for Real-Estate Developers** — control intelligence, govern execution.

Chat → blueprint approve/decline → hierarchical agents (Orchestrator → CMO → parallel specialists) → Control Tower evidence, approvals and audit. Future SaaS billing meters workflow runs.

## Product pillars

1. **Control Tower** — command, permissions, approvals, monitoring
2. **Intelligence Engine** — planning, orchestration, evidence, evaluation
3. **AI Executive Workforce** — first pack: real-estate CMO

## Repository layout

```text
apps/control-tower/   Next.js + Clerk (chat + tower)
apps/api/             FastAPI modular monolith
governance/           Trust Engine, approvals, audit, policies
intelligence/         LangGraph, planner, evaluation
executives/cmo/       Real-estate CMO pack
runtime/adapters/     Model, research, sandbox publish, hermes stubs
shared/contracts/     Shared Pydantic / TS contracts
infrastructure/       Docker Compose, Alembic
docs/                 PRD, blueprint, ADRs, plans
tests/
```

## Quick start

```bash
# Postgres
docker compose -f infrastructure/docker-compose.yml up -d

# API
cd apps/api && python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Control Tower
cd apps/control-tower && npm install && npm run dev
```

Copy `.env.example` to `.env` and fill Clerk / database values. Never commit secrets.

## Engineering rules

See [AGENTS.md](AGENTS.md), [docs/PRD.md](docs/PRD.md), [docs/TECHNICAL_BLUEPRINT.md](docs/TECHNICAL_BLUEPRINT.md), and [docs/plans/2026-11-10-phase0-discovery.md](docs/plans/2026-11-10-phase0-discovery.md).

## License

Proprietary — all rights reserved unless otherwise noted.
