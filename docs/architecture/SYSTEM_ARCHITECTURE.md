# System Architecture (baseline)

## Pillars

1. **Control Tower** — Next.js (`apps/control-tower`): overview, chat, Copilot, workflows, approvals, agents, metering.  
2. **Intelligence Engine** — FastAPI modules + LangGraph CMO graph + AG-UI mount.  
3. **AI Executive Workforce** — first pack: RE CMO (market / competitor / strategy / evaluator).

## Planes

- Control: identity, tenancy, RBAC, Trust, approvals, audit  
- Intelligence: planning, orchestration, evaluation hooks  
- Execution: sandbox publish adapter (no real ad spend)  
- Evidence: sources, claims, verification status  

## Connectivity (bucket 2)

```
Browser Copilot → /api/copilotkit (CopilotRuntime) → HttpAgent → /api/v1/agui/cmo (LangGraph)
Classic Chat    → /api/v1/chat → same workflow/Trust services
```

## Authority

Trust Engine authorizes consequential actions. CopilotKit/AG-UI/HERMES/Deep Agents do not.

See ADRs under `docs/adr/` (indexed in `docs/architecture/ADR/README.md`).
