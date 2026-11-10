.PHONY: api-install api-test api-dev ui-install ui-dev ui-typecheck compose-up

compose-up:
	docker compose -f infrastructure/docker-compose.yml up -d

api-install:
	cd apps/api && python3 -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]"

api-test:
	cd apps/api && . .venv/bin/activate && AUTH_DISABLED_FOR_TESTS=true ENVIRONMENT=development pytest -q

api-dev:
	cd apps/api && . .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

ui-install:
	cd apps/control-tower && npm install

ui-dev:
	cd apps/control-tower && npm run dev

ui-typecheck:
	cd apps/control-tower && npm run typecheck
