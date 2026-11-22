# LUXOR9 — Master Status

**Operating model:** Human-on-the-Loop (HOTL)  
**Updated:** 2026-11-22  
**Source of truth repo:** `https://github.com/rajkhemani/luxor9`

## LUXOR9 ENGINEERING STATUS

| Field | Value |
|---|---|
| Current phase | **PHASE 00 — Project discovery and baseline** (formal gate still open) |
| Current task | Dubai demo harden (Interview Me + pitch) + HOTL register refresh |
| Overall project status | **SHIPPING_PAST_GATE** — Phase 00 never formally closed; post-baseline work landed on main |
| Phase progress | Phases 01–06/09–10 PARTIAL on main; 07–08/11–13 BACKLOG |
| Verified features | See §Verified |
| Unverified features | See §Unverified |
| Failed tests | None in last focused Interview Me / API checks (this refresh) |
| Open security issues | Clerk JWKS verification not implemented (demo auth in development); cloud-start demo-auth loopback-only |
| Open architectural decisions | D-007…D-010 in `DECISION_REGISTER.md` (plus D-000…D-006 closed/accepted) |
| Blocked tasks | Phase ACCEPTED marks blocked by Phase 00 founder checkpoint |
| Founder approvals needed | (1) Accept/amend Phase 00, (2) merge Dubai demo PR, (3) choose L9-010 vs L9-012, (4) close stale #9/#10/#11 |
| Evidence generated | `docs/evidence/phase-reports/P00-discovery.md`; Full System Update canvas 2026-11-22 |
| Next recommended action | Merge Dubai demo; close Phase 00 gate in writing; pick L9-010 (JWKS) or L9-012 (CopilotKit) |

## Verified (local / CI evidence)

- Vertical slice shape: chat → blueprint → CMO specialists → evidence → Tower → approval.
- Classic chat + Copilot/AG-UI wired to shared services (MemorySaver checkpointer).
- Trust Engine policy/approvals/audit present; sandbox publish only.
- Control Tower surfaces: `/chat` · `/copilot` · `/command` · `/workflows` · `/approvals` · `/agents` · `/stack` · `/metering` · `/atelier` · marketing `/home`.
- Merged since Phase 00 baseline: #1, #3, #4, #5, #6, #7, #8/#12, #13.
- Interview Me skill (PR in flight): gates blueprint behind one-question-at-a-time interview + explicit yes.

## Unverified / partial

- Live web research adapters (still synthetic).
- Postgres LangGraph checkpointer resume after process kill.
- Clerk-authenticated human sessions (JWKS missing).
- Pilot-grade evidence quality / eval corpus thresholds.
- Playwright e2e vertical demo.
- HERMES real adapter / memory+knowledge phases.

## Progress dimensions (independent)

| Dimension | Estimate | Basis |
|---|---|---|
| Product completeness | Thin vertical slice | Loop shape exists; research quality not pilot-grade |
| Engineering completeness | Foundation partial | Monolith + Tower + AG-UI; Phases 01–13 unfinished |
| Security completeness | Pre-pilot | Demo auth; JWKS missing; sandbox publish only |
| Test/verification completeness | Early | Unit/API strong; Playwright e2e not yet |
| Deployment readiness | Local/pilot draft | Compose + Render blueprint; production **RED** |

## Open pull requests (as of 2026-11-22)

| PR | Title | Notes |
|---|---|---|
| [#14](https://github.com/rajkhemani/luxor9/pull/14) / successor | Dubai demo: Interview Me + B2B RE pitch | Active; iterate review findings before merge |
| [#9](https://github.com/rajkhemani/luxor9/pull/9) | Bootstrap unified orchestration core | **Do not merge** without ADR (parallel package risk) |
| [#10](https://github.com/rajkhemani/luxor9/pull/10) / [#11](https://github.com/rajkhemani/luxor9/pull/11) | Stale Phase 0 validation plan branches | Superseded by merged #4/#6 — close hygiene |
| [#2](https://github.com/rajkhemani/luxor9/pull/2) | Dependabot npm bumps | Review separately |

## Docs lag note

Registers were last written 2026-11-10 while shipping continued (Stack hub, `/home`, video guide, Dubai demo). This 2026-11-22 refresh records that lag without treating Phase 00 as ACCEPTED — founder still owns the gate.
