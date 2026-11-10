# ADR-0001: Start with a Modular Monolith

- **Status:** Proposed
- **Date:** 2026-11-10

## Context

The product is early, team capacity is limited, and the MVP needs cohesive changes across identity, governance, workflows and evidence. Premature service splitting would increase deployment and debugging overhead.

## Decision

Start with one FastAPI application organized into explicit domain modules and separately runnable background workers. Keep contracts clear and isolate external providers behind adapters.

## Consequences

Positive:
- Faster end-to-end delivery.
- Simpler local development and deployment.
- Shared transactions for approval, audit and workflow records.

Trade-offs:
- Requires discipline to preserve module boundaries.
- Individual modules cannot scale independently until extracted.

Revisit only when measured throughput, security isolation, ownership or deployment constraints justify extraction.
