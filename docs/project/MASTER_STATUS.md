# LUXOR9 — Master Status

**How to read this:** One-page snapshot. Written for humans, not only engineers.  
**Operating model:** Human-on-the-Loop (HOTL)  
**Updated:** 2026-11-22  
**Code home:** https://github.com/rajkhemani/luxor9  
**`main` tip this update reflects:** `911b817` (in-memory Control Tower mode exists — **not** used for the Dubai pitch)

## Plain-English summary

We are preparing a Dubai real-estate developer demo: **voice and chat**, Interview Me questions (PR #14), evidence answer, **one** card, **one** Approve. The pitch uses the **real cloud backend**. Phase 00 is good enough for demos; formal sign-off comes later. Approve runs a **read-only live API call** and shows real data on the card (**D-012 closed**).

| Field | Value |
|---|---|
| Formal phase | Phase 00 ungated for HOTL ACCEPTED; **D-013** = ok for demos |
| Hottest work | Dubai demo UX + land PR #14 + **implement** L9-DEMO-APPROVE-LIVE (read-only live call) |
| Overall status | Demo decisions accepted; D-012 resolved; implementation next |
| What works on `main` | Thin CMO loop; synthetic research; sandbox publish adapter; Tower in-memory mode available |
| What the pitch must use | Real API / cloud backend (D-011b), not in-memory mode |
| Open security gap | Clerk JWKS unfinished |
| Decisions just accepted | D-011, D-011a, D-011b, D-011c, **D-012** (read-only live Approve), D-013 |
| Open PR of note | [#14](https://github.com/rajkhemani/luxor9/pull/14) Interview Me + B2B RE pitch |
| Next engineering step | Wire Approve → read-only live API → show real data on the card |

## Verified (so far)

- API health / AG-UI status respond when API is up.
- Earlier pytest baseline green (16 passed, 2026-11-10).
- Classic Chat worked after CORS fix.
- `main` has in-memory Tower demo store (`demo-store.ts`, `/api/v1/[...path]`) for empty API base — kept for offline/dev, not the pitch.

## Partial / not done

- Voice + chat excellent UX (approved; not fully built).
- Interview Me on `main` (still PR #14).
- Read-only live Approve wiring (D-012 chosen; code not done yet).
- Live research quality; Postgres checkpointer resume; Playwright e2e.

## Completeness (rough)

| Area | Level | Plain words |
|---|---|---|
| Product | Thin slice | Loop exists; pitch UX still being locked |
| Engineering | Foundation partial | Monolith + Tower + AG-UI |
| Security | Pre-pilot | Demo auth; Approve is read-only live call only |
| Deploy | Local / draft | Production stays RED without founder approval |
