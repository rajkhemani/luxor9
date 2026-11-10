# ADR-0005: CopilotKit stack — Kit, OpenBot, OpenDuet (and “OpenKit”)

- **Status:** Accepted for MVP integration (thin)
- **Date:** 2026-11-10

## Clarifying names

| Name you hear | What it is |
|---|---|
| **CopilotKit** (“the kit” / often called OpenKit informally) | Frontend + runtime SDKs for chat, generative UI, HITL, shared state |
| **AG-UI** | Wire protocol between agent backends and user apps |
| **OpenBot** | Self-hostable *coworker workspace* (bots, computers, approvals, audit) built on CopilotKit + AG-UI |
| **OpenDuet** | Proactive UI skin on OpenBot (morning brief, “needs you”, background work) |
| **OpenDots / OpenMuse** | Other OpenBot-facing product templates (channels / personal agent) — not required for RE CMO MVP |

There is no separate official product named “OpenKit”; in this repo **OpenKit means CopilotKit SDK + AG-UI**.

## Decision for Luxor9 MVP (thin, winning)

Keep **Luxor9 Trust Engine + tenancy + evidence** as system of record.

Integrate CopilotKit in three layers without forking OpenBot:

1. **Agent (Python):** expose CMO LangGraph over **AG-UI** (`/api/v1/agui/cmo`).
2. **Runtime (Next.js):** `@copilotkit/runtime` at `/api/copilotkit` → `HttpAgent` → AG-UI.
3. **Frontend:** CopilotKit chat inside Control Tower (`/copilot`) for the pitch surface.

**OpenBot / OpenDuet** are documented as Phase-2 deployable workspaces that *consume the same AG-UI CMO bot*. Do not vendor their full monorepos into MVP.

## Authority boundary

- CopilotKit/OpenBot UI never authorizes side effects.
- Blueprint / campaign publish still go through Luxor9 Trust Engine + approval binding.
- Model text is never an authorization token.

## Consequences

Positive: GTM chat feels like a modern agent product; path to OpenBot coworker workspace is clean.

Trade-offs: requires CopilotKit Intelligence key for some OpenBot features later; MVP runtime works without Intelligence for local demo.
