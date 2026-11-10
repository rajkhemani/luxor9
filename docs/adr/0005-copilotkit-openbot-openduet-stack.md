# ADR-0005: CopilotKit stack — Kit, OpenBot, OpenDuet (and “OpenKit”)

- **Status:** Accepted for MVP integration (thin)
- **Date:** 2026-11-10
- **Related:** [ADR-0006](0006-three-bucket-agent-stack.md) — three-bucket model

## Clarifying names

| Name you hear | What it is | Bucket |
|---|---|---|
| **CopilotKit** (“the kit” / often called OpenKit informally) | Connectivity SDK: chat, generative UI, HITL, shared state | **2** |
| **AG-UI** | Wire protocol agent ↔ user app (stream, steer, resume, recursive) | **2** |
| **OpenBot** | Self-hostable coworker workspace on CopilotKit + AG-UI | **2** shell |
| **OpenDuet** | Proactive UI skin on OpenBot | **2** shell |
| **CopilotKit Intelligence** | Production learning from interactions → skills/datasets | **3** |
| **LangGraph** (not CopilotKit) | Orchestration graph for CMO hierarchy | **1** |

There is no separate official product named “OpenKit”; in this repo **OpenKit means CopilotKit SDK + AG-UI** (bucket 2).

## Decision for Luxor9 MVP (thin, winning)

Keep **Luxor9 Trust Engine + tenancy + evidence** as system of record.

Integrate CopilotKit as **bucket-2 connectivity** without forking OpenBot:

1. **Agent (Python / bucket 1):** expose CMO LangGraph over **AG-UI** (`/api/v1/agui/cmo`).
2. **Runtime (Next.js / bucket 2):** `@copilotkit/runtime` at `/api/copilotkit` → `HttpAgent` → AG-UI.
3. **Frontend (bucket 2):** CopilotKit chat inside Control Tower (`/copilot`).

**OpenBot / OpenDuet** are Phase-2 deployable workspaces that *consume the same AG-UI CMO bot*.
**Intelligence (bucket 3)** is Phase-2 — optional keys, never required for local demo.

## Authority boundary

- CopilotKit/OpenBot UI never authorizes side effects.
- Blueprint / campaign publish still go through Luxor9 Trust Engine + approval binding.
- Model text is never an authorization token.
- Learned skills (bucket 3) remain auditable and cannot bypass Trust gates.

## Consequences

Positive: GTM chat streams like a modern agent product; path to OpenBot coworker workspace is clean; LangGraph stays the orchestration brain.

Trade-offs: reconnect/resume needs Postgres checkpointer in prod; Intelligence keys only when bucket 3 ships.
