"""Shared FastAPI dependencies."""

from __future__ import annotations

from fastapi import Request

from luxor9.core.orchestrator import Orchestrator


def get_orchestrator(request: Request) -> Orchestrator:
    """Return the process-wide orchestrator stored on app state."""
    return request.app.state.orchestrator
