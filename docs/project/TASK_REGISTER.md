# Task Register

Statuses: BACKLOG | DISCOVERY | PLANNED | AWAITING_APPROVAL | APPROVED | IN_PROGRESS | BLOCKED | IN_REVIEW | TESTING | VERIFIED | ACCEPTED | REJECTED | DEFERRED

## Active / gate

| ID | Phase | Title | Status | Risk | Role | Approval |
|---|---|---|---|---|---|---|
| L9-DEMO-VOICE | 05/10 | Dubai demo: excellent voice + chat UX | APPROVED | Amber | Frontend / AI | D-011 / D-011a |
| L9-DEMO-LIVE-BE | 05/10 | Pitch uses real cloud backend (not in-memory Tower) | APPROVED | Amber | Frontend / DevOps | D-011b |
| L9-DEMO-INTERVIEW | 05/10 | Land / use PR #14 Interview Me before plan | APPROVED | Amber | Backend / Frontend | D-011c |
| L9-DEMO-APPROVE-LIVE | 05/10 | Wire Approve to a **read-only live API call**; show real data on the card | **APPROVED — next: implement** | Amber | Backend / Frontend / Trust | D-012 resolved |
| P00-BASELINE | 00 | Discovery report + HOTL registers | IN_REVIEW (demo-ok per D-013) | Low | TPM | Formal sign-off later |
| L9-FIX-COPILOT | 05/06 | CopilotChat agentId bind | Merged earlier (#5) | Low | Frontend | Done on main |
| L9-PLAN-VAL | 00 | Architecture validation plan | Merged earlier (#4) | Low | Architect | Done on main |

### Demo acceptance (short)

- Voice and chat both work; UX feels excellent.
- Interview Me asks questions before the plan (PR #14).
- Evidence answer + exactly one automation card + one Approve.
- Backend is the real cloud API (leave `NEXT_PUBLIC_API_BASE_URL` pointing at API).
- Approve runs a **read-only live API call** and shows real data on the card (D-012).

### L9-DEMO-APPROVE-LIVE — next concrete step

1. Pick the exact read-only API endpoint on the real backend (e.g. health/overview/evidence for the open workflow).  
2. On Approve, call that endpoint live (not the in-memory store).  
3. Put the returned fields on the same automation card.  
4. Keep Trust/audit logging; do not add CRM/ERP writes or ad spend.

## Recommended next (awaiting founder choice)

| ID | Phase | Title | Status | Priority | Risk | Role | Acceptance (summary) |
|---|---|---|---|---|---|---|---|
| L9-010 | 03 | Clerk JWKS verification | AWAITING_APPROVAL | P0 | Amber | Security / Backend | Bearer verified; demo header blocked outside development |
| L9-012 | 05/06 | CopilotKit official onboard (`bba95955d7ea`) | AWAITING_APPROVAL | P1 | Amber | Frontend / AI Systems | CLI applied without duplicating Trust logic |
| L9-011 | 06 | Postgres checkpointer resume | BACKLOG | P1 | Amber | AI Orchestration | Kill/resume AG-UI thread |
| L9-013 | 09/10 | Live research adapter v1 | BACKLOG | P1 | Amber | Backend / CMO | At least one live source type + hashes |
| L9-014 | 09/10 | Evaluation corpus gates | BACKLOG | P1 | Green to Amber | QA / AI Systems | Fixture thresholds enforced |
| L9-015 | 11 | Playwright vertical demo | BACKLOG | P2 | Green | QA | Headless objective to Tower |
| L9-016 | 13 | Pilot packaging | BACKLOG | P2 | Amber/Red | DevOps / TPM | Runbook; no prod deploy without RED approval |

## Deferred

| ID | Title | Status | Reason |
|---|---|---|---|
| L9-DEEP | Deep Agents spike | DEFERRED | Optional harness; no day-one need |
| L9-HERMES | Real HERMES adapter | DEFERRED | Phase 07; stub sufficient |
| L9-INTEL | CopilotKit Intelligence (bucket 3) | DEFERRED | Learning layer Phase 2 |
| L9-CELERY | Redis + Celery | DEFERRED | Until LangGraph workers need a separate queue |
| L9-INMEM-DEMO | Use in-memory Tower mode for Dubai pitch | DEFERRED / rejected for pitch | D-011b: real cloud backend for demo |
