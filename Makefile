.PHONY: install test lint format serve demo agents docker

install:
	pip install -e ".[dev]"

test:
	pytest -q

lint:
	ruff check src tests
	black --check src tests

format:
	ruff check --fix src tests
	black src tests

serve:
	uvicorn luxor9.api.main:app --reload

demo:
	luxor9 demo

agents:
	luxor9 agents

docker:
	docker compose -f infra/docker/docker-compose.yml up --build
