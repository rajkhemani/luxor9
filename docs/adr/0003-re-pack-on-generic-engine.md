# ADR-0003: Real-Estate Pack on Generic Blueprint Engine

- **Status:** Accepted
- **Date:** 2026-11-10

## Context

Commercial brand is “Luxor9 for Real-Estate Developers.” Future business model is SaaS charged per workflow. A RE-only hardcode blocks expansion; a fully generic open-ended engine lacks a sharp pilot demo.

## Decision

Build a **generic** engine:

- chat → structured blueprint → customer approve/decline
- orchestrator → executive → parallel specialists
- Trust Engine + evidence + metering events

Register the first **capability pack** as CMO for Dubai real-estate developers (market, competitor, launch). Additional executives/packs are registry stubs until funded.

## Consequences

Positive: pilot story is clear; SaaS metering and hierarchy scale without rewrite.

Trade-offs: discipline required to keep pack-specific logic out of the core graph and Trust Engine.
