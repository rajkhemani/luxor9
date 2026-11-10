# Prompt 00 — Discover, challenge and plan (Plan mode)

You are working on LUXOR9. Read `AGENTS.md`, `docs/PRD.md`, `docs/TECHNICAL_BLUEPRINT.md` and `docs/EXECUTION_ROADMAP.md` before proposing changes.

Use the Superpowers workflow. Start with brainstorming/design clarification; do not write application code yet. Treat the existing PRD as the baseline, but challenge contradictions, overspecification and unverified technology assumptions.

Tasks:
1. Inspect the current workspace and report its exact state. Do not overwrite or delete anything.
2. Identify missing decisions and technical risks.
3. Verify current official documentation and compatibility for the selected versions of Python, Node, FastAPI, PostgreSQL, SQLAlchemy/Alembic, LangGraph, CopilotKit/AG-UI and any proposed queue/runtime package. Cite links in the resulting document.
4. Recommend the smallest coherent MVP architecture. Prefer modular monolith. Keep Deep Agents and HERMES optional behind adapters until compatibility/value is proven.
5. Produce a phased implementation plan with tickets, file paths, dependencies, tests, risks and acceptance criteria.
6. Save the approved plan under `docs/plans/`.

Do not install dependencies, create app scaffolds, run destructive commands, provision cloud resources or connect production accounts during this phase. End with unresolved decisions and the single next ticket.
