# Changelog (engineering)

## 2026-11-22

- Recorded Dubai demo brainstorm decisions: **D-011 / D-011a / D-011b / D-011c / D-012 / D-013**.
  - Voice **and** chat; excellent UX.
  - Real cloud backend for the pitch (not in-memory Tower mode).
  - Use PR #14 Interview Me before the plan.
  - Phase 00 ok for demos; formal sign-off later.
  - **D-012 closed:** Approve = **read-only live API call** showing real data on the card (not CRM/ERP writes; not paid ads).
- `main` tip noted: `911b817` in-memory Control Tower demo mode (offline/dev path).
- Standing agent rule added: ask simple clarifying questions **one at a time** before multi-option work.
- Task **L9-DEMO-APPROVE-LIVE** unblocked → next step: implement the read-only live call.

## 2026-11-10

- Merged PR #1: Phase 0 platform foundation (chat → blueprint → CMO).
- Merged PR #3: three-bucket AG-UI/CopilotKit connectivity + full-stack sync + CORS loopback fix.
- Open PR #4: architecture validation plan (docs) — later merged.
- Open PR #5: CopilotChat `luxor9_cmo` / `default` agent bind fix — later merged.
- Introduced HOTL project registers under `docs/project/` (Phase 00).
