# Dubai demo UX — voice + chat (D-011 family)

**Status:** Accepted for demos (founder brainstorm 2026-11-22; D-012 closed same day)  
**Audience:** Anyone preparing tomorrow’s Dubai real-estate developer demo  
**Does not authorize:** production deploy, CRM/ERP writes, or paid ad spend

## What the demo should feel like

1. **Voice and chat both work** — the customer can speak or type. The experience must feel excellent either way.
2. **Real cloud backend** — do **not** use Control Tower in-memory demo mode (`911b817` empty-API path) for this pitch. Call the live FastAPI / cloud API.
3. **Interview Me first (PR #14)** — the agent asks clarifying questions before it builds a plan.
4. **Answer + one automation card** — after evidence work, show an evidence-based answer and **exactly one** automation card with **exactly one** Approve button.
5. **Approve = read-only live API call (D-012)** — pressing Approve calls the **real** backend with a **read-only** request and shows the real data returned on the card. That proves the system is connected. It does **not** write to CRM/ERP or spend ad money.

## Constraints that stay true

| Topic | Rule |
|---|---|
| Customer | Dubai real-estate developers |
| Story | Market-to-launch intelligence |
| Database | PostgreSQL is the system of record |
| Approve proof | Read-only live API → show real data on the card (D-012) |
| CRM / ERP / ads | Still not part of this demo |
| Phase 00 | Good enough for demos; formal sign-off comes later (D-013) |

## Acceptance checklist (demo day)

- [ ] Voice input works; chat input also works  
- [ ] Interview Me questions run before the plan (PR #14 behavior)  
- [ ] Evidence-based answer is visible  
- [ ] Exactly one automation card + one Approve button  
- [ ] Approve runs a **read-only live** API call and shows real data on the card  
- [ ] In-memory Tower mode is off for the pitch  
