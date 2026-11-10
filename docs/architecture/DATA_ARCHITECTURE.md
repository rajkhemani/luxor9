# Data Architecture (baseline)

## System of record

PostgreSQL (Compose service `postgres`). Alembic migrations under `apps/api/alembic`.

## Tenant ownership

Tenant-owned records include `tenant_id`. Application services must scope queries by principal tenant.

## Core entities (implemented)

Tenants, Users, Memberships/Roles, Workflows, Blueprints, Agents registry, Evidence, Claims, Approvals, Audit events, Metering events.

## Gaps (Phase 02 remaining)

- Published ERD diagram  
- Formal retention/backup-restore runbook  
- RLS as defense-in-depth (optional later)  
- pgvector only when semantic retrieval required  
- Object storage for uploads (local/DB blobs interim)

## Non-goals now

Separate microservice databases; multi-region replication.
