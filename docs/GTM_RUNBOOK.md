# GTM runbook — deploy-ready today, pitch tomorrow

## Product one-liner

**Luxor9 for Real-Estate Developers** — speak or chat a development brief → Interview Me clarifies → agents gather evidence → one automation card → Approve proves a **real live** backend connection (exact safe action still being chosen — see D-012).

## Thin stack

| Surface | Path | Port |
|---|---|---|
| API (required for Dubai pitch) | `apps/api` | 8000 |
| Web Control Tower | `apps/control-tower` | 3000 |
| Mobile (iOS/Android) | `apps/mobile` | device/emulator |

**Pitch rule (D-011b):** use the **real cloud / local API backend**. Do **not** pitch with Control Tower in-memory demo mode (empty `NEXT_PUBLIC_API_BASE_URL`).

## Local pitch (15 minutes)

```bash
make api-install && make api-dev          # terminal 1 — required
make ui-install && make ui-dev            # terminal 2
# Ensure NEXT_PUBLIC_API_BASE_URL points at the API (e.g. http://127.0.0.1:8000)
```

Optional one-click seed (still useful; does not replace Interview Me for the spoken path):

```bash
curl -s -X POST http://127.0.0.1:8000/api/v1/demo/run \
  -H 'X-Demo-User: user_demo_admin' -H 'Content-Type: application/json'
```

### Live demo script (D-011 family)

Detail: `docs/project/DEMO_UX_VOICE_FIRST.md`.

1. Speak **or** type: “Market-to-launch intelligence for a Dubai Creek Harbour residential tower, AED 2.5–6M, Q2.”
2. **Interview Me (PR #14)** asks clarifying questions before a plan is built.
3. Show the evidence-based answer (sources + `UNVERIFIED` gaps).
4. Show **one** automation card with **one** Approve button.
5. Approve → must hit the **real live backend** with the **named safe action** from D-012 (not chosen yet — do not claim CRM/ERP/ad spend until named).

## Production-ish deploy (Docker)

```bash
export POSTGRES_PASSWORD='replace-me'
export NEXT_PUBLIC_API_BASE_URL='https://api.your-domain.com'
export API_CORS_ORIGINS='https://app.your-domain.com'
docker compose -f infrastructure/docker-compose.prod.yml up -d --build
```

Hardening before first external pilot:

- [ ] Set `ENVIRONMENT=production`
- [ ] Configure Clerk JWKS (demo auth is off in production)
- [ ] Upgrade Clerk Pro + MFA before consequential human approvers
- [ ] Change Postgres password; backups on
- [ ] TLS termination (Render/Fly/Cloudflare/nginx)
- [ ] Resolve D-012: name the one safe live Approve action before promising it in sales

## Mobile for tomorrow’s hallway demo

Mac + Xcode required for iPhone. See `docs/MOBILE.md`.

```bash
cd apps/mobile
flutter run -d ios --dart-define=API_BASE_URL=http://<your-lan-ip>:8000
# or Android emulator: http://10.0.2.2:8000
```

## What not to claim in GTM (until D-012 names otherwise)

- Live CRM or ERP **production** writes
- Real paid ad spend
- Guaranteed ROI
- Full C-suite executives (CMO pack only; others are roadmap stubs)
- Production Clerk SSO until JWKS path is finished

**Conflict flag:** D-012 says Approve must prove a real live backend action. That does **not** automatically mean CRM, ERP, or ad spend. Wait for the named safe action.
