# ADR-0002: Dual Surface — Chat + Control Tower

- **Status:** Accepted
- **Date:** 2026-11-10

## Context

The product must be sellable via a ChatGPT-like conversation while enterprises require governance surfaces for monitoring, approvals and audit. Building only chat under-serves buyers; building only dashboards under-serves solo-founder demos.

## Decision

Ship both surfaces in one Next.js app (`apps/control-tower`) against one FastAPI workflow API:

1. **Chat** — objective intake, blueprint presentation, blueprint approve/decline.
2. **Control Tower** — workflow status, approval centre, evidence/report, audit.

Business logic lives only in the API. UI never authorizes actions.

## Consequences

Positive: matches sales motion and enterprise buying criteria; one API prevents dual logic.

Trade-offs: larger MVP UI surface. Mitigate by sharing workflow contracts and shipping only overview / workflow / approvals / evidence / chat routes first.
