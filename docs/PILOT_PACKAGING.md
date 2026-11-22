# Pilot packaging — Luxor9 for Real-Estate Developers

## Demo script

> **Legacy for the Dubai customer pitch.** Use `docs/project/DEMO_UX_VOICE_FIRST.md` and `docs/GTM_RUNBOOK.md` (voice + chat, Interview Me, read-only live Approve). The steps below are an older sandbox path kept for pilot packaging checks.

1. Open Control Tower Chat.
2. Enter: “Market-to-launch intelligence for a Dubai Creek Harbour residential tower.”
3. Review blueprint → **Approve**.
4. Watch workflow move to report + evidence; treat fixture sources as **UNVERIFIED** until live adapters exist.
5. Open **Approvals** → approve sandbox `campaign_publish` (no real ad network call) — **not** the D-012 Dubai pitch Approve proof.
6. Confirm audit + metering events (`workflow_run.created`, `workflow_run.executed`).

## Security checklist

- [ ] `ENVIRONMENT=production` disables demo auth bypass
- [ ] Clerk Hobby only for internal demos; **Pro + MFA** before external humans approve consequential actions
- [ ] No production secrets in git; `.env` from `.env.example` only
- [ ] Tenant scoping verified by isolation tests
- [ ] Approval fingerprint tamper / expiry tests green
- [ ] Sandbox adapter only for campaign publish until customer authorizes a live channel
- [ ] Backups/restore documented for Postgres before paid pilot data

## Upgrade gate

First external pilot with consequential approvers → Clerk Pro + MFA before that session.
