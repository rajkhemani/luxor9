# GTM runbook — deploy-ready today, pitch tomorrow

## Product one-liner

**Luxor9 for Real-Estate Developers** — chat a development brief → approve a governed blueprint → parallel CMO agents produce sourced market/competitor/launch intel → approve sandbox campaign publish.

## Thin stack

| Surface | Path | Port |
|---|---|---|
| API | `apps/api` | 8000 |
| Web Control Tower | `apps/control-tower` | 3000 |
| Mobile (iOS/Android) | `apps/mobile` | device/emulator |

## Local pitch (15 minutes)

```bash
make api-install && make api-dev          # terminal 1
make ui-install && make ui-dev            # terminal 2
```

Optional one-click demo seed:

```bash
curl -s -X POST http://127.0.0.1:8000/api/v1/demo/run \
  -H 'X-Demo-User: user_demo_admin' -H 'Content-Type: application/json'
```

Then open http://127.0.0.1:3000 → Approvals → approve sandbox publish.

### Live chat script

1. Chat: “Market-to-launch intelligence for a Dubai Creek Harbour residential tower, AED 2.5–6M, Q2.”
2. Approve blueprint.
3. Open workflow → show evidence + `UNVERIFIED` model gaps.
4. Approvals → approve `campaign_publish` (sandbox only — no real ads).
5. Metering → show `workflow_run.*` events (future SaaS billing).

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
- [ ] Keep campaign publish on sandbox until customer authorizes a live channel

## Mobile for tomorrow’s hallway demo

Mac + Xcode required for iPhone. See `docs/MOBILE.md`.

```bash
cd apps/mobile
flutter run -d ios --dart-define=API_BASE_URL=http://<your-lan-ip>:8000
# or Android emulator: http://10.0.2.2:8000
```

## What not to claim in GTM

- Real ad spend / CRM writes (sandbox only)
- Guaranteed ROI
- Full C-suite executives (CMO pack only; others are roadmap stubs)
- Production Clerk SSO until JWKS path is finished
