# GTM runbook — deploy-ready today, pitch tomorrow

## Product one-liner

**Luxor9 for Real-Estate Developers** — speak or chat a development brief → Interview Me clarifies → agents gather evidence → one automation card → Approve runs a **read-only live API call** and shows real data on the card (D-012).

## Thin stack

| Surface | Path | Port |
|---|---|---|
| API (required for Dubai pitch) | `apps/api` | 8000 |
| Web Control Tower | `apps/control-tower` | 3000 |
| Mobile (iOS/Android) | `apps/mobile` | device/emulator |

**Pitch rule (D-011b):** the **customer-facing Dubai pitch** uses the **real cloud API** (a deployed FastAPI URL). Do **not** use Control Tower in-memory demo mode (empty `NEXT_PUBLIC_API_BASE_URL`). Local FastAPI is for **rehearsal only**.

Canonical demo UX: `docs/project/DEMO_UX_VOICE_FIRST.md`. Older scripts in `docs/MOBILE.md` and `docs/PILOT_PACKAGING.md` are **legacy** for this pitch.

## A) Customer pitch (cloud backend)

```bash
# Point Tower at the deployed API (example):
export NEXT_PUBLIC_API_BASE_URL='https://api.your-domain.com'
export AGUI_CMO_URL='https://api.your-domain.com/api/v1/agui/cmo'
export API_CORS_ORIGINS='https://app.your-domain.com'

make ui-install && make ui-dev
```

`make ui-dev` keeps your exported `NEXT_PUBLIC_API_BASE_URL` (it no longer forces localhost).

### Talk track

1. Speak **or** type: “Market-to-launch intelligence for a Dubai Creek Harbour residential tower, AED 2.5–6M, Q2.”
2. **Interview Me (PR #14)** asks clarifying questions before a plan is built.
3. Show the answer. Say clearly: research fixtures are **synthetic** until live sources (L9-013); claims stay **UNVERIFIED** — do not present them as real Dubai market facts.
4. Show **one** automation card with **one** Approve button.
5. Approve → **read-only live API call** on the cloud backend; show the real data returned on the card (D-012). No CRM/ERP write. No paid ads.

## B) Local rehearsal (real FastAPI + Postgres — not in-memory Tower)

```bash
make compose-up                                   # Postgres
# Set DATABASE_URL to the Compose Postgres URL from .env.example / compose file
make api-install && make api-dev                  # terminal 1
make ui-install && make ui-dev                    # terminal 2 → defaults to http://127.0.0.1:8000
```

Optional one-click seed (rehearsal only; skips Interview Me):

```bash
curl -s -X POST http://127.0.0.1:8000/api/v1/demo/run \
  -H 'X-Demo-User: user_demo_admin' -H 'Content-Type: application/json'
```

**Do not retry** `demo/run` if the first call may have succeeded — each retry creates another workflow/approval and breaks the “one card” demo. If extras appear, clear them before presenting.

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
- [ ] Confirm Approve’s read-only live call is Trust-logged and demo-safe

## Mobile for hallway rehearsal

Mac + Xcode required for iPhone. See `docs/MOBILE.md` (legacy path noted there). Prefer the voice+chat web flow in `DEMO_UX_VOICE_FIRST.md` for the Dubai pitch.

```bash
cd apps/mobile
flutter run -d ios --dart-define=API_BASE_URL=http://<your-lan-ip>:8000
```

## What not to claim in GTM

- Synthetic research as real Dubai market evidence (say **UNVERIFIED** / fixture)
- Live CRM or ERP **writes**
- Real paid ad spend
- Guaranteed ROI
- Full C-suite executives (CMO pack only; others are roadmap stubs)
- Production Clerk SSO until JWKS path is finished

**What you *can* claim for Approve (D-012):** pressing Approve hits the live backend with a **read-only** call and shows real data on the card.
