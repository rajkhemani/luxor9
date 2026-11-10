# LUXOR9 Phase 0 — Architecture validation (review before next build)

**Date:** 2026-11-10  
**Workspace:** `/agent/repos/luxor9` (branch `cursor/agui-three-bucket-connectivity-1a3a`, PR #3)  
**Mode:** Plan only — no new product features in this document  
**Inputs:** `AGENTS.md`, `docs/PRD.md`, `docs/TECHNICAL_BLUEPRINT.md`, `docs/EXECUTION_ROADMAP.md`, ADRs 0001–0006, prior plan `docs/plans/2026-11-10-phase0-discovery.md`, live stack inspection

---

## 1. Workspace inspection (exact state)

This is **not** an empty Windows `D:\LUXOR9-PLATFORM` greenfield. The Cursor Build Kit is already seeded here, and a vertical slice is already implemented.

| Area | Present? | Notes |
|---|---|---|
| Build kit docs/rules/prompts | Yes | `docs/*`, `.cursor/rules`, `prompts/00–06`, `AGENTS.md` |
| `apps/api` FastAPI monolith | Yes | auth, tenancy models, workflows, chat, Trust, approvals, audit, evidence, demo, AG-UI |
| `apps/control-tower` Next.js | Yes | Overview, classic Chat, Workflows, Approvals, Agents, Metering, **Copilot** |
| `apps/mobile` Flutter | Yes | Tower mirror (iOS needs Mac) |
| Postgres Compose + Docker/Render | Yes | `infrastructure/*`, `render.yaml`, CI workflow |
| ADRs | Yes | modular monolith, dual UI, RE pack, Clerk, CopilotKit, **three-bucket** |
| Sibling inventory (read-only) | Outside | `luxor9-unified-os`, `luxor9-core`, `Ceo-brain` — do not merge blindly |

**Runtime observed in this environment**

- Python **3.12.3**, Node **22.23.4**
- FastAPI **0.162.3**, Next **^15.0.3**
- CopilotKit react-core **^1.85.0**, `@ag-ui/client` **^1.0.4**
- API pytest: **16 passed** (incl. CORS + AG-UI status) after latest sync

---

## 2. Product architecture (approved baseline — unchanged)

**Positioning:** Luxor9 for Real-Estate Developers, generic engine underneath.

**Definition of success (first real product):**

> Founder submits one business objective → LUXOR9 plans → specialists research → evidence collected → intelligence generated → Control Tower shows it → human approval governs the next action.

**Authority rules (non-negotiable)**

1. LangGraph owns business workflow state.  
2. Deep Agents = specialist delegation only after a spike proves value.  
3. HERMES never controls authorization or governance.  
4. Trust Engine authorizes consequential side effects; model text never does.  
5. CopilotKit / AG-UI = **connectivity** (bucket 2), not policy.

Three-bucket framing (ADR-0006):

| Bucket | Job | Luxor9 choice |
|---|---|---|
| 1 Orchestration | graphs, tools, multi-agent | LangGraph CMO hierarchy |
| 2 Connectivity | stream, HITL, resume, recursive visibility | AG-UI + CopilotKit |
| 3 Learning | production skills/datasets | CopilotKit Intelligence — **Phase 2** |

---

## 3. Technology compatibility (verified, not assumed)

| Component | Intended | Compatibility finding | Cite |
|---|---|---|---|
| Interface | React + TS / Next.js | Next 15 + React 19 in Control Tower — OK for MVP | Next 15 docs |
| Agent UI | CopilotKit + AG-UI | Official path: `@copilotkit/react-core/v2` + `@copilotkit/runtime/v2` + `HttpAgent` → AG-UI; Python `ag-ui-langgraph` + FastAPI | [copilotkit.ai onboarding](https://copilotkit.ai/onboarding-prompts/bba95955d7ea), [PyPI ag-ui-langgraph](https://pypi.org/project/ag-ui-langgraph/), [PyPI copilotkit](https://pypi.org/project/copilotkit/) |
| Backend | FastAPI | FastAPI ≥0.115,<1 required by CopilotKit Python SDK — satisfied | same |
| Workflow | LangGraph | `langgraph>=0.3.25,<2` (SDK); `ag-ui-langgraph` current pins often `>=0.6,<2` — keep lockfile disciplined | same |
| Python | 3.12 | CopilotKit/ag-ui-langgraph require `>=3.10,<3.15` — OK | same |
| Database | PostgreSQL | Compose + Alembic present; local SQLite still used for some dev/tests — **prod path must be Postgres** | blueprint §3 |
| Queue | Redis + Celery | **Deferred** until LangGraph workers need a separate queue | blueprint §3 |
| Deep Agents | optional harness | **Not installed** — adapter stub only | AGENTS.md |
| HERMES | runtime adapter | **Stub only** — no authority | AGENTS.md |
| Eval | LangSmith + custom | Custom claim/status checks exist; LangSmith **not** wired | roadmap Phase 3–4 |
| Auth | Clerk Hobby | Env/JWKS hooks exist; **JWT verify not implemented** — demo `X-Demo-User` in development | ADR-0004 |

**Compatibility test verdict (CopilotKit/AG-UI):** Pass for thin MVP — AG-UI CMO mounted, CopilotKit runtime + `/copilot` page present. Remaining: durable thread resume (Postgres checkpointer), end-to-end browser stream demo, official `copilotkit onboard` alignment (run id `bba95955d7ea` pending explicit yes).

---

## 4. Gap analysis vs “first real LUXOR9 product”

| Success step | Status | Gap |
|---|---|---|
| Submit objective | Done (classic chat + demo seed; Copilot path wired) | Browser Copilot e2e stream still to prove after CORS fix |
| System plans work (blueprint) | Done | Blueprint is structured; not yet rich generative-UI form |
| Specialists research | Partial | Parallel graph runs; research adapters are **stub/synthetic**, not live web crawl |
| Evidence collected | Partial | Evidence/claim models + API exist; receipts are demo-grade |
| Intelligence generated | Partial | Report assembly exists; quality/eval corpus thin |
| Control Tower displays | Done for core screens | Polish / empty states; no Clerk login UI yet |
| Human approval next action | Done (blueprint + Trust sandbox publish path) | Clerk-verified approvers before external pilot |

**Honest MVP statement:** The **governed loop shape** is proven in-process with synthetic research. The **evidence-backed market intelligence quality** is not yet pilot-grade.

---

## 5. Architectural risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Dual business paths | Classic REST chat vs AG-UI Copilot could diverge | Single workflow/Trust services; Copilot only transports |
| Fake evidence theater | Stub research looks finished | Mark UNVERIFIED; gate pilot claims on real adapters + eval corpus |
| Auth gap | Demo header ≠ Clerk | Fail-closed outside development; implement JWKS before external users |
| Checkpoint/resume unfinished | Bucket-2 “laptop closes” story incomplete | Wire `langgraph-checkpoint-postgres` on Compose Postgres in next intelligence ticket |
| Dependency churn | CopilotKit v2 + dual `@ag-ui` typings | Pin versions; keep HttpAgent cast documented; re-run onboard when approved |
| Scope explosion | Full C-suite / Deep Agents / Redis / Intelligence learning | Keep adapters stubbed; one ticket at a time |
| Sibling monorepo merge | `luxor9-unified-os` temptation | Inventory-only until ADR + port tests |

---

## 6. Build vs integrate

| Capability | Decision |
|---|---|
| Trust Engine / approvals / audit | **Build** (Luxor9 core IP) |
| Workflow + blueprint + tenancy | **Build** |
| LangGraph CMO graph | **Build** (orchestration) |
| CopilotKit UI + AG-UI protocol | **Integrate** (connectivity) |
| Clerk | **Integrate** (identity) |
| Deep Agents | **Defer** behind spike |
| HERMES | **Defer** adapter stub |
| Research sources | **Integrate** approved APIs later; stub now |
| Object storage / Stripe / Celery | **Defer** |

---

## 7. Database & API boundaries

**System of record:** PostgreSQL (Compose). Tenant-owned tables carry `tenant_id`.

**API surface**

- REST `/api/v1/*` — workflows, chat, approvals, trust, evidence, audit, metering, demo  
- AG-UI `/api/v1/agui/cmo` — bucket-2 agent stream  
- Next `/api/copilotkit` — CopilotKit runtime → HttpAgent → AG-UI  

**Not yet:** public multi-tenant Clerk session cookies on Tower; RLS as defense-in-depth; separate worker service.

---

## 8. Security & tenant isolation requirements

- Server resolves principal + tenant + role; never trust browser-supplied role/tenant.  
- Demo auth only when `environment=development` or `AUTH_DISABLED_FOR_TESTS`.  
- Approvals bound to exact action fingerprint; expiry/replay/tamper tests required.  
- CORS must allow both `localhost` and `127.0.0.1` Tower origins (fixed).  
- No secrets in git; `.env.example` placeholders only.  
- Before paid pilot: Clerk JWKS verification + MFA upgrade gate (Hobby → Pro).

---

## 9. Test-first strategy

| Layer | Tool | Rule |
|---|---|---|
| API behavior | Pytest | Red→green for every Trust/chat/workflow/CORS/AG-UI status change |
| UI types | `tsc --noEmit` | Required on Control Tower PRs |
| Mobile smoke | Flutter test | Theme/shell minimum |
| E2E later | Playwright | One scripted: objective → blueprint → approve → Tower evidence |
| Eval corpus | Custom fixtures | Unsupported-claim rate thresholds before calling research “real” |

Do **not** treat generated UI as done without a failing-then-passing test for the behavior claimed.

---

## 10. Phased plan from here (small tickets)

Prior discovery tickets L9-000…L9-008 are largely landed as a thin slice. Re-baselined next sequence:

| ID | Ticket | Acceptance |
|---|---|---|
| **L9-010** | **Clerk JWKS verification (dev→staging)** | Real Bearer verified; demo header blocked outside development; `/me` works with Clerk |
| **L9-011** | **Postgres checkpointer for AG-UI threads** | Kill API mid-run; reconnect with `threadId`; state resumes |
| **L9-012** | **CopilotKit onboard alignment** (`--run=bba95955d7ea`) | Official CLI applied to `apps/control-tower` without duplicating Trust logic; CopilotChat welcome/slots polish |
| **L9-013** | **Research adapter v1 (public web, rate-limited)** | ≥1 live source type; content hash + URI; claims link evidence |
| **L9-014** | **Evaluation corpus + UNVERIFIED gates** | Fixed fixture set; fail build if unsupported rate exceeds threshold |
| **L9-015** | **Playwright vertical demo** | Headless: chat/copilot → approve → Tower evidence visible |
| **L9-016** | **Pilot packaging** | Security checklist, backup/restore note, GTM script, Render env matrix |

Still deferred: Deep Agents spike, HERMES real adapter, Redis/Celery, CopilotKit Intelligence (bucket 3), Stripe.

---

## 11. Unresolved decisions (need human review)

1. **Primary agent surface for pilots:** classic Chat, CopilotKit `/copilot`, or both equally supported?  
2. **When to run official CopilotKit onboard** (`bba95955d7ea`) against `apps/control-tower` vs keep hand-rolled thin wire?  
3. **First live research sources** for Dubai RE (which domains/APIs are approved)?  
4. **Clerk production instance** timing relative to first external approver.  
5. **Windows `D:\LUXOR9-PLATFORM` vs this GitHub `luxor9` repo** as source of truth — recommend **this repo** as SoT; treat Windows kit extract as mirror only.

---

## 12. Recommendation

**Do not regenerate the whole platform.** Treat the modular monolith + RE CMO slice as the foundation. Next implementation ticket after plan approval:

### Single next ticket: **L9-010 — Clerk JWKS verification**

Closest alternative if GTM demo polish is preferred first: **L9-012 CopilotKit onboard + CopilotChat polish** (still no Trust changes).

---

## Review checklist (approve before coding)

- [ ] Accept three-bucket model (LangGraph ≠ CopilotKit)  
- [ ] Accept synthetic research as interim; live adapters gated by L9-013/014  
- [ ] Choose next ticket: L9-010 vs L9-012  
- [ ] Confirm GitHub `luxor9` remains source of truth (not a second Windows tree)  
- [ ] Confirm Deep Agents / HERMES remain stubs  

**Status:** Awaiting human review — no further feature implementation until approved.
