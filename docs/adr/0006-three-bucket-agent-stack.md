# ADR-0006: Three-bucket agent stack (orchestration · connectivity · learning)

- **Status:** Accepted
- **Date:** 2026-11-10
- **Supersedes confusion:** “LangGraph vs CopilotKit” — they are different buckets

## Context

Agent products confuse three orthogonal layers. Luxor9 adopts the CopilotKit
framing so every dependency maps cleanly:

| Bucket | Job | Luxor9 choice |
|---|---|---|
| **1 — Orchestration** | Plan, tool use, multi-agent graphs, MCP tools | LangGraph CMO hierarchy + Trust Engine side-effects |
| **2 — Connectivity** | Stream work live, bi-directional HITL, reconnect/resume, recursive tool/sub-agent visibility, structured + unstructured payloads | **AG-UI** + **CopilotKit** runtime/UI |
| **3 — Production learning** | Per-user/group/org skills from interactions; auditable; optional fine-tune export | **CopilotKit Intelligence** (Phase 2 — not required for MVP) |

Buckets **compose**; they do not compete. MCP (bucket 1 tool surface) and AG-UI
(bucket 2 protocol) work together.

## Bucket 2 requirements (connectivity contract)

AG-UI / CopilotKit must support:

1. **Live stream** — specialist progress appears as it happens, not one final blob.
2. **Steer mid-run** — interrupt, correct, approve (blueprint gate + Trust approvals).
3. **Reconnect / resume** — laptop closes; thread resumes without losing the run.
4. **Recursive reflection** — tools and sub-agents (market + competitor parallel) surface coherently.
5. **Mixed payloads** — text/voice alongside tool calls, state updates, forms, generative UI.

## Decision

- MVP ships buckets **1 + 2** thin: LangGraph behind AG-UI (`/api/v1/agui/cmo`) →
  CopilotKit runtime (`/api/copilotkit`) → Control Tower `/copilot`.
- Classic REST chat remains a parallel surface for demos without CopilotKit.
- Bucket **3** is documented only until Intelligence credentials and tenancy
  scoping are ready; learning never bypasses Trust Engine audit.

## Authority boundary (unchanged)

Connectivity never authorizes side effects. Publish / money / external write
paths stay on Luxor9 Trust Engine + approval binding.

## Consequences

Positive: clear buying/build story; OpenBot/OpenDuet (bucket-2 shells) can attach
to the same AG-UI bot later; Intelligence (bucket 3) plugs in without rewriting
the CMO graph.

Trade-off: reconnect/resume quality depends on AG-UI thread + LangGraph
checkpointer configuration in prod (`langgraph-checkpoint-postgres`).
