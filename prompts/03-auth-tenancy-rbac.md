# Prompt 03 — Identity, tenancy and RBAC

Implement L9-003 and L9-004 as separate reviewed tasks.

First, recommend and verify a maintained authentication approach that fits the deployment requirements. Do not invent password hashing, token signing or session security. Implement verified authentication and server-derived principal context.

Then implement:
- tenants;
- user identities and tenant memberships;
- roles and permissions;
- user-role assignments;
- agent machine principals with explicit scopes;
- tenant-scoped repository/service methods;
- authorization dependencies on every protected endpoint.

Tests must include user A attempting to read, update and infer tenant B resources by changing IDs, query parameters and request bodies. Test role boundaries and disabled membership. Never trust client-supplied tenant_id, role or principal_id. Add database row-level security only if connection-pool/session behavior is correctly designed and tested. Stop if isolation tests fail.
