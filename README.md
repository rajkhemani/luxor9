# LUXOR9

Unified agent orchestration platform — a single, runnable core that consolidates
the fragmented LUXOR9 prototypes into one canonical codebase.

This repository implements **Phase 1 (consolidation)** and the start of **Phase 2
(MCP layer)** from the strategic roadmap: a working orchestration engine, the 12
specialized agents, a platform-agnostic MCP transport, a versioned FastAPI
surface, and container + CI scaffolding.

## What's here

```
luxor9/
├── src/luxor9/
│   ├── core/          # Orchestrator, AgentRegistry, TaskQueue, StateManager, AuditLog
│   ├── agents/        # AgentBase + the 12 specialized agents + roster factory
│   ├── mcp/           # Platform-agnostic transport: base adapter, adapters/, router, registry
│   ├── api/           # FastAPI app (v2): agents, tasks, orchestrate, admin
│   ├── shared/        # Pydantic domain models + enums
│   └── cli.py         # `luxor9 [agents|demo|serve]`
├── tests/             # unit + integration + API tests
├── infra/             # Dockerfile, docker-compose, K8s manifests
└── .github/workflows/ # CI (ruff, black, pytest)
```

> The roadmap proposes a `packages/<name>` monorepo layout. This first pass uses a
> conventional installable `src/luxor9` package with the same module boundaries
> (`core`, `agents`, `mcp`, `api`, `shared`); splitting into independently
> published workspaces is a later step.

## Architecture

```
                 ┌──────────────────────────────┐
   Task DAG ───▶ │          Orchestrator        │
                 │  registry · queue · state ·  │
                 │  audit · mcp_router          │
                 └───────┬───────────┬──────────┘
        capability lookup │           │ text / tool calls
                          ▼           ▼
                   AgentRegistry   McpRouter ──▶ adapters (anthropic, openai, mock)
                          │
                          ▼
                  12 specialized agents
```

- **Orchestrator** resolves each task's agent (explicit assignment or capability),
  runs parallel-safe tasks concurrently and sequential ones in order, applies a
  per-agent timeout, and emits lifecycle events + audit records.
- **TaskQueue** validates the DAG (missing deps, cycles), surfaces ready tasks,
  and cascades `BLOCKED` to descendants of any failed task.
- **McpRouter** walks a fallback chain (Anthropic → OpenAI → mock), so the
  platform runs with **no API keys** — the deterministic mock adapter answers.
- **StateManager** is an in-memory event bus (pub/sub + snapshot) with a shape
  ready for a Redis Streams backend.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"          # add ,anthropic,openai for real LLM adapters

luxor9 agents                    # list the 12 agents
luxor9 demo                      # run a sample multi-agent workflow (offline)
luxor9 serve                     # http://localhost:8000/docs
pytest                           # run the test suite
```

With `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` set (and the matching extra
installed), the router uses the real provider and falls back to mock on error.

## API (v2)

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/health` | Liveness + agent count |
| GET    | `/api/v2/agents` | List agents |
| GET    | `/api/v2/agents/{type}/health` | Agent health |
| PATCH  | `/api/v2/agents/{type}/pause` | Pause an agent |
| POST   | `/api/v2/tasks` | Submit + run a single task |
| GET    | `/api/v2/tasks/{id}` | Task status / result |
| DELETE | `/api/v2/tasks/{id}` | Cancel a pending task |
| POST   | `/api/v2/orchestrate` | Run a task DAG |
| GET    | `/api/v2/orchestrate/{id}` | Workflow status |
| GET    | `/api/v2/admin/dashboard` | System metrics |
| GET    | `/api/v2/admin/audit` | Audit trail |

Example:

```bash
curl -X POST localhost:8000/api/v2/tasks \
  -H 'content-type: application/json' \
  -d '{"title":"aggregate","assigned_agent":"DATA_ANALYST","input":{"data":[2,4,6]}}'
```

## The 12 agents

`OVERSEER`, `HR_MANAGER`, `INTEGRATION_LEAD`, `RESEARCHER`, `DATA_ANALYST`,
`DEVELOPER`, `VISIONARY`, `DIRECTOR`, `COMMUNICATOR`, `NAVIGATOR`, `SPEEDSTER`,
`ANTIGRAVITY`. `DATA_ANALYST`, `NAVIGATOR`, and `SPEEDSTER` compute
deterministically; the rest produce structured results through the MCP router.

## Docker

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

Brings up the API plus Postgres and Redis (wired for the persistence/event work
in later phases).

## Roadmap

See [`docs/architecture.md`](docs/architecture.md) for how this maps to the
8-phase plan and what comes next (DB persistence, Redis Streams, observability,
Kubernetes).
