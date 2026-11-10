# Prompt 02 — Database and contracts

Implement only L9-002 based on the approved architecture.

Deliver:
- PostgreSQL connection configuration with environment-based secrets.
- SQLAlchemy base and session lifecycle.
- Alembic setup and first migration.
- Core shared typed contracts for tenant context, authenticated principal, workflow ID and trace ID.
- Health/readiness checks that distinguish API liveness from database readiness.
- Tests for configuration validation, DB connection and migration from an empty database.

Do not create broad speculative tables. Implement only the tables required for the next identity/tenant phase. Do not use real customer data. Include migration recovery notes. Run the tests and report exact commands/results.
