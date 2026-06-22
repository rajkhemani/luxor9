# LUXOR9 Architecture

This document describes the current implementation and how it maps to the 8-phase
strategic roadmap.

## Components

### `shared/` — domain model
Pydantic models (`Task`, `AgentInfo`, `ModelInfo`, `Event`, `AuditRecord`,
`CompletionResult`, ...) and enums (`AgentType`, `Capability`, `TaskStatus`,
`AgentStatus`, `McpPlatform`, `EventType`). Everything else depends only on this
layer, keeping the model portable.

### `core/` — orchestration engine
| Module | Responsibility |
|--------|----------------|
| `orchestrator.py` | Central hub: intake, scheduling, execution, events, audit. |
| `agent_registry.py` | Register agents; resolve by type or capability discovery. |
| `task_queue.py` | DAG validation (missing deps, cycles), ready-set computation, failure cascade. |
| `state_manager.py` | In-memory event bus (pub/sub + snapshot). |
| `audit_log.py` | Append-only audit trail. |

**Execution model.** `Orchestrator.run()` repeatedly asks the queue for ready
tasks (dependencies satisfied), runs parallel-safe ones concurrently via
`asyncio.gather` and sequential ones in order, enforces a per-agent timeout, and
records `TASK_*` events + audit entries. A failed task cascades `BLOCKED` to its
descendants, so the loop always terminates.

### `agents/` — the 12 specialized agents
`AgentBase` defines the contract (`execute`, `can_handle`, `health_check`,
`info`). Each agent declares its `agent_type` and `capabilities`.
`ExecutionContext` carries the task, the MCP router, and the results of upstream
dependencies. `DATA_ANALYST`, `NAVIGATOR`, and `SPEEDSTER` compute
deterministically; the others call the MCP router.

### `mcp/` — platform-agnostic transport
`McpPlatformAdapter` is the per-platform interface (`authenticate`,
`list_models`, `complete`, optional `call_tool`/`get_resources`). Adapters:
`MockAdapter` (deterministic, offline), `AnthropicAdapter`, `OpenAIAdapter`
(both optional dependencies, lazily imported). `McpRouter` walks a fallback
chain (Anthropic → OpenAI → mock) so a missing key or SDK degrades gracefully.
`ModelRegistry` aggregates `ModelInfo` and selects a model by strategy
(`cost`, `speed`, `quality`, `balanced`).

### `api/` — FastAPI surface (v2)
App factory with a lifespan that builds the orchestrator, bootstraps agents, and
registers real adapters when keys are present. Route groups: `agents`, `tasks`,
`orchestration`, `admin`, plus `/health`.

## Mapping to the roadmap

| Phase | Status in this repo |
|-------|---------------------|
| **1. Consolidation** | ✅ Single canonical package; unified orchestrator, agent base + registry, dependency-resolving task queue; linting (ruff/black) + CI. |
| **2. MCP layer** | ◑ Adapter pattern + router + model registry/selection; Anthropic/OpenAI/mock adapters. Remaining: Google, Groq, DeepSeek, xAI, HuggingFace, Replicate, OpenRouter, custom HTTP; credential vault. |
| **3. State & persistence** | ◑ Event-driven `StateManager` (in-memory) + append-only `AuditLog`. Remaining: Postgres schema + Alembic, Redis Streams, pgvector embeddings. |
| **4. API & versioning** | ◑ `/api/v2` agents/tasks/orchestrate/admin + OpenAPI via FastAPI. Remaining: versioning middleware, WebSocket streaming. |
| **5. Observability** | ▢ Admin dashboard endpoint only. Remaining: OpenTelemetry, Prometheus, Grafana, ELK. |
| **6. Production deploy** | ◑ Dockerfile, docker-compose, K8s Deployment/Service/HPA, GitHub Actions. Remaining: Helm, staging/prod environments, blue-green. |
| **7. Advanced features** | ◑ Capability discovery + model selection. Remaining: inter-agent messaging, marketplace, persistent memory. |
| **8. Security & compliance** | ▢ Audit trail foundation. Remaining: JWT/RBAC, rate limiting, encryption. |

Legend: ✅ done · ◑ foundation in place · ▢ not started.

## Recommended next steps

1. **Persistence (Phase 3).** Add SQLAlchemy models + Alembic migrations for
   `agents`, `tasks`, `audit_log`, `embeddings`; back `TaskQueue`/`AuditLog` with
   the DB while keeping the in-memory path for tests.
2. **Redis Streams (Phase 3).** Implement a `StateManager` backend behind the
   existing `emit`/`subscribe` interface for cross-process events.
3. **More MCP adapters (Phase 2).** Each is a small subclass of
   `McpPlatformAdapter`; register them in `McpRouter`.
4. **WebSocket task streaming (Phase 4).** Expose `StateManager.subscribe()` over
   `WS /api/v2/tasks/{id}/stream`.
5. **Observability (Phase 5).** Add OpenTelemetry instrumentation around
   `_execute_task` and a Prometheus exporter.

## Testing

`pytest` covers the queue (deps, cycles, cascades), registry discovery, MCP
router fallback + model selection, agent computation, end-to-end orchestration
(events + audit + failure handling), and the HTTP API.
