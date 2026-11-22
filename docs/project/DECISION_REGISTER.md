# Decision Register

Plain list of big choices. **Accepted** means we agreed. **OPEN** means we still need a human answer.

| ID | Decision | Status | Date | Notes |
|---|---|---|---|---|
| D-000 | Repo source of truth is GitHub `rajkhemani/luxor9` | Proposed | 2026-11-10 | Windows kit extract = mirror only |
| D-001 | Modular monolith: FastAPI + Next Control Tower | Accepted (ADR-0001) | 2026-11-10 | |
| D-002 | Dual surface: chat + Control Tower (+ Copilot connectivity) | Accepted (ADR-0002/0005) | 2026-11-10 | |
| D-003 | Real-estate commercial pack on a generic engine | Accepted (ADR-0003) | 2026-11-10 | |
| D-004 | Clerk Hobby now; JWKS before external consequential approvers | Accepted direction (ADR-0004); implementation incomplete | 2026-11-10 | |
| D-005 | Three-bucket stack: LangGraph / AG-UI+CopilotKit / Intelligence later | Accepted (ADR-0006) | 2026-11-10 | |
| D-006 | Deep Agents / HERMES stay stubs until a spike | Accepted (AGENTS.md) | 2026-11-10 | |
| D-007 | Lasting pilot UI: classic Chat vs Copilot vs both | **OPEN** | 2026-11-10 | Demo path clarified by D-011a (voice **and** chat) |
| D-008 | Run official CopilotKit onboard `bba95955d7ea` now? | **OPEN** | 2026-11-10 | Amber |
| D-009 | First approved live research sources for Dubai RE | **OPEN** | 2026-11-10 | Amber integration |
| D-010 | Next foundation ticket: L9-010 (JWKS) vs L9-012 (CopilotKit onboard) | **OPEN** | 2026-11-10 | Phase 00 exit hygiene |
| D-011 | Dubai demo core: speak/type → multi-agent evidence → one automation card + one Approve | **Accepted** (demo) | 2026-11-22 | See `DEMO_UX_VOICE_FIRST.md`; Approve action = **D-012** |
| D-011a | Demo UX quality: **both voice and chat**; experience must be excellent | **Accepted** | 2026-11-22 | Extends D-011; Approve proof = **D-012** |
| D-011b | **Customer pitch** uses the **real cloud API**; not Control Tower in-memory mode | **Accepted** | 2026-11-22 | Local FastAPI+Postgres = rehearsal only; in-memory Tower (`911b817`) = offline/dev; live Approve = **D-012** |
| D-011c | Use open PR #14 **Interview Me** (ask questions before the plan) | **Accepted** | 2026-11-22 | Merge/land #14 needed; Approve after card = **D-012** |
| D-012 | Approve = **read-only live API call**; show real data on the card (**display only**) | **Accepted** (resolved — option 1) | 2026-11-22 | Proves the system connects to a live backend and works. **No real outbound send** (no CRM/ERP write, no paid ads, no customer message). Referenced from D-011 / D-011a / D-011b / D-011c. |
| D-013 | Phase 00 is **approved enough for demos**; formal written sign-off comes later | **Accepted** (demo authority only) | 2026-11-22 | Phase 00 not fully ACCEPTED in HOTL sense |

## D-012 resolution (simple)

**Founder choice (option 1):** when the customer presses Approve, the app makes a **read-only live API call**. That call returns **real data for display only** on the automation card. It proves Luxor9 is connected to a live system and actually works — **without sending anything real** outward (no write, no spend, no blast).

**Closed.** D-011a / D-011b / D-011c all point here for the Approve proof.
