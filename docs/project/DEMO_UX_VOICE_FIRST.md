# Dubai demo UX — voice + chat (D-011 family)

**Status:** Accepted for demos (founder brainstorm 2026-11-22)  
**Audience:** Anyone preparing tomorrow’s Dubai real-estate developer demo  
**Does not authorize:** production deploy, secret spend, or unnamed CRM/ERP production writes

## What the demo should feel like

1. **Voice and chat both work** — the customer can speak or type. The experience must feel excellent either way.
2. **Real cloud backend** — do **not** use Control Tower in-memory demo mode (`911b817` empty-API path) for this pitch. Call the live FastAPI / cloud API.
3. **Interview Me first (PR #14)** — the agent asks clarifying questions before it builds a plan.
4. **Answer + one automation card** — after evidence work, show an evidence-based answer and **exactly one** automation card with **exactly one** Approve button.
5. **Approve must prove a real live connection** — pressing Approve must do a **real** call against the live backend (not a fake sandbox-only toast). See **D-012 conflict** below.

## Constraints that stay true

| Topic | Rule |
|---|---|
| Customer | Dubai real-estate developers |
| Story | Market-to-launch intelligence |
| Database | PostgreSQL is the system of record |
| CRM / ERP | Not day-one product claims; any write needs an explicit, named, safe action |
| Phase 00 | Good enough for demos; formal sign-off comes later (D-013) |

## Open conflict (must resolve before the live Approve ships)

Older docs said: sandbox campaign publish only, no real ad spend, no CRM/ERP writes.  
New choice (D-012): Approve must prove a **real live** backend action.

**We have not yet chosen which safe live action that button runs.** Candidates to discuss (examples only — not chosen):

- a **read-only** live API call that returns real data into the card, or  
- a **clearly labeled test write** to a non-production / reversible store, or  
- another founder-named action that is still Trust-gated

Until that choice is recorded, do not implement live CRM, live ERP, or live ad spend.

## Acceptance checklist (demo day)

- [ ] Voice input works; chat input also works  
- [ ] Interview Me questions run before the plan (PR #14 behavior)  
- [ ] Evidence-based answer is visible  
- [ ] Exactly one automation card + one Approve button  
- [ ] Approve hits the **real cloud backend** with the **named safe live action** from D-012  
- [ ] In-memory Tower mode is off for the pitch  
