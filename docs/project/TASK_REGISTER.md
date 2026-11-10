# Task Register

Statuses: BACKLOG | DISCOVERY | PLANNED | AWAITING_APPROVAL | APPROVED | IN_PROGRESS | BLOCKED | IN_REVIEW | TESTING | VERIFIED | ACCEPTED | REJECTED | DEFERRED

## Active / gate

| ID | Phase | Title | Status | Risk | Role | Approval |
|---|---|---|---|---|---|---|
| P00-BASELINE | 00 | Discovery report + HOTL registers | IN_REVIEW | Low | TPM / Architect | Founder Phase 00 gate |
| L9-FIX-COPILOT | 05/06 | CopilotChat agentId bind | IN_REVIEW (PR #5) | Low | Frontend Lead | GREEN (bugfix) |
| L9-PLAN-VAL | 00 | Architecture validation plan | IN_REVIEW (PR #4) | Low | Architect | Founder review |

## Recommended next (awaiting founder choice)

| ID | Phase | Title | Status | Priority | Risk | Role | Acceptance (summary) |
|---|---|---|---|---|---|---|---|
| L9-010 | 03 | Clerk JWKS verification | AWAITING_APPROVAL | P0 | Amber | Security / Backend | Bearer verified; demo header blocked outside development |
| L9-012 | 05/06 | CopilotKit official onboard (`bba95955d7ea`) | AWAITING_APPROVAL | P1 | Amber | Frontend / AI Systems | CLI applied without duplicating Trust logic |
| L9-011 | 06 | Postgres checkpointer resume | BACKLOG | P1 | Amber | AI Orchestration | Kill/resume AG-UI thread |
| L9-013 | 09/10 | Live research adapter v1 | BACKLOG | P1 | Amber | Backend / CMO | ≥1 live source type + hashes |
| L9-014 | 09/10 | Evaluation corpus gates | BACKLOG | P1 | Green→Amber | QA / AI Systems | Fixture thresholds enforced |
| L9-015 | 11 | Playwright vertical demo | BACKLOG | P2 | Green | QA | Headless objective→Tower |
| L9-016 | 13 | Pilot packaging | BACKLOG | P2 | Amber/Red | DevOps / TPM | Runbook; **no prod deploy without RED approval** |

## Deferred

| ID | Title | Status | Reason |
|---|---|---|---|
| L9-DEEP | Deep Agents spike | DEFERRED | Optional harness; no day-one need |
| L9-HERMES | Real HERMES adapter | DEFERRED | Phase 07; stub sufficient |
| L9-INTEL | CopilotKit Intelligence (bucket 3) | DEFERRED | Learning layer Phase 2 |
| L9-CELERY | Redis + Celery | DEFERRED | Until LangGraph workers need separate queue |
