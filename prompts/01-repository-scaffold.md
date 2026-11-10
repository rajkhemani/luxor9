# Prompt 01 — Repository scaffold (Plan first, then Agent)

Implement only L9-001 after reviewing the approved plan.

Requirements:
- Create the smallest repository structure needed for a React/TypeScript Control Tower and FastAPI modular monolith.
- Add formatting, linting, type-checking and test commands for each app.
- Add `.env.example` with placeholder names only; add secure `.gitignore` entries.
- Add Docker Compose only for local PostgreSQL and Redis if Redis is required by the approved architecture.
- Add health endpoints and a minimal smoke test.
- Pin dependency versions using current compatibility evidence and lockfiles.
- Do not implement auth, Trust Engine, AI agents or dashboard features in this ticket.

Use TDD for behavior. Run actual install, lint, type and test commands. Report exact output and stop if the environment cannot support the chosen versions. Never run destructive cleanup commands.
