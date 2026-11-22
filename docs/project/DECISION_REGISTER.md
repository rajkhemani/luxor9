# Decision Register

Plain list of big choices. **Accepted** means we agreed. **OPEN** means we still need a human answer. **Conflict** means two decisions disagree until we pick the safe path.

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
| D-011 | Dubai demo core: speak/type → multi-agent evidence → one automation card + one Approve | **Accepted** (demo) | 2026-11-22 | See `DEMO_UX_VOICE_FIRST.md` |
| D-011a | Demo UX quality: **both voice and chat**; experience must be excellent | **Accepted** | 2026-11-22 | Extends D-011 |
| D-011b | Demo runs on the **real cloud backend**, not Control Tower in-memory mode | **Accepted** | 2026-11-22 | In-memory path (`911b817`) stays for offline/dev only |
| D-011c | Use open PR #14 **Interview Me** (ask questions before the plan) | **Accepted** | 2026-11-22 | Merge/land #14 needed for demo |
| D-012 | Approve button must trigger a **real live** backend action (prove connection) | **Accepted intent — CONFLICT / ACTION OPEN** | 2026-11-22 | Conflicts with older sandbox-only / no live CRM-ERP / no real ad spend rules. **Safe live action not chosen yet.** |
| D-013 | Phase 00 is **approved enough for demos**; formal written sign-off comes later | **Accepted** (demo authority only) | 2026-11-22 | Phase 00 not fully ACCEPTED in HOTL sense |

## Explicit conflict note (D-012)

| Older rule (still in PRD / GTM / AGENTS) | New demo intent (D-012) |
|---|---|
| Campaign publish is sandbox-only until a customer authorizes a live channel | Approve must prove a **real live** backend call |
| Do not claim live CRM / ERP writes or real ad spend in GTM | Demo Approve is no longer “fake receipt only” |
| No production side effects without explicit founder approval of the **specific** action | Founder still must name the **exact safe live action** before engineering wires it |

**Human decision still needed:** What is the one safe real action the Approve button runs?  
Examples to choose from (not selected): read-only live API call · clearly labeled test write · other Trust-gated action you name.
