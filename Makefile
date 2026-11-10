.PHONY: api-install api-test api-dev api-ruff \
	ui-install ui-dev ui-typecheck ui-build ui-test \
	mobile-get mobile-analyze mobile-test \
	compose-up compose-down compose-prod \
	demo-run stack verify sync-check

# ── Infra planes (run in parallel terminals) ──────────────────────────
#   make compose-up && make api-dev   | make ui-dev | flutter run

compose-up:
	docker compose -f infrastructure/docker-compose.yml up -d postgres

compose-down:
	docker compose -f infrastructure/docker-compose.yml down

compose-prod:
	docker compose -f infrastructure/docker-compose.prod.yml up -d --build

compose-stack:
	docker compose -f infrastructure/docker-compose.yml up -d --build

# ── API (intelligence + governance + AG-UI) ───────────────────────────

api-install:
	cd apps/api && python3 -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]"

api-test:
	cd apps/api && . .venv/bin/activate && AUTH_DISABLED_FOR_TESTS=true ENVIRONMENT=development pytest -q

api-ruff:
	cd apps/api && . .venv/bin/activate && ruff check app tests

api-dev:
	cd apps/api && . .venv/bin/activate && \
	AUTH_DISABLED_FOR_TESTS=true ENVIRONMENT=development \
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ── Control Tower (REST + CopilotKit) ─────────────────────────────────

ui-install:
	cd apps/control-tower && npm install

ui-dev:
	cd apps/control-tower && \
	NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 \
	AGUI_CMO_URL=http://127.0.0.1:8000/api/v1/agui/cmo \
	npm run dev

ui-typecheck:
	cd apps/control-tower && npm run typecheck

ui-build:
	cd apps/control-tower && npm run build

ui-test:
	cd apps/control-tower && npm test

# ── Mobile (Flutter mirror) ───────────────────────────────────────────

mobile-get:
	cd apps/mobile && flutter pub get

mobile-analyze:
	cd apps/mobile && flutter analyze

mobile-test:
	cd apps/mobile && flutter test

# ── GTM helpers ───────────────────────────────────────────────────────

demo-run:
	curl -s -X POST http://127.0.0.1:8000/api/v1/demo/run \
	  -H 'X-Demo-User: user_demo_admin' -H 'Content-Type: application/json' | python3 -m json.tool

sync-check:
	@test -f apps/api/app/intelligence/agui_cmo.py
	@test -f apps/api/app/routers/agui.py
	@test -f 'apps/control-tower/app/api/copilotkit/[[...slug]]/route.ts'
	@test -f apps/control-tower/app/command/page.tsx
	@test -f apps/control-tower/app/stack/page.tsx
	@test -f apps/control-tower/lib/luxor-brand.ts
	@test -f apps/mobile/pubspec.yaml
	@test -f infrastructure/docker-compose.yml
	@test -f infrastructure/Dockerfile.api
	@test -f infrastructure/Dockerfile.ui
	@test -f render.yaml
	@test -f docs/INFRASTRUCTURE.md
	@test -f docs/adr/0005-copilotkit-openbot-openduet-stack.md
	@test -f docs/adr/0006-three-bucket-agent-stack.md
	@echo "infra sync-check OK — buckets 1+2 + Luxor Stack hub; API / Tower / Command Bridge / Mobile / Compose / Render"

verify: sync-check api-test ui-typecheck

# Thin winning stack entry (API only; open ui-dev in parallel)
stack: api-dev
