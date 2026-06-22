"""FastAPI application factory.

Builds a process-wide :class:`Orchestrator`, bootstraps the 12 default agents,
and registers real MCP adapters when the matching API keys are present in the
environment. Without keys the router transparently falls back to the mock
adapter, so the API is fully runnable out of the box.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

from luxor9 import __version__
from luxor9.api.routes import admin, agents, orchestration, tasks
from luxor9.api.schemas import HealthResponse
from luxor9.core.orchestrator import Orchestrator
from luxor9.mcp.adapters.anthropic import AnthropicAdapter
from luxor9.mcp.adapters.openai import OpenAIAdapter


def build_orchestrator() -> Orchestrator:
    orch = Orchestrator()
    orch.bootstrap_default_agents()
    if os.environ.get("ANTHROPIC_API_KEY"):
        orch.router.register(AnthropicAdapter())
    if os.environ.get("OPENAI_API_KEY"):
        orch.router.register(OpenAIAdapter())
    return orch


@asynccontextmanager
async def lifespan(app: FastAPI):
    orch = build_orchestrator()
    await orch.router.refresh_models()
    app.state.orchestrator = orch
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="LUXOR9 Orchestration API",
        version=__version__,
        description="Unified agent orchestration platform (API v2).",
        lifespan=lifespan,
    )

    @app.get("/health", response_model=HealthResponse, tags=["meta"])
    def health() -> HealthResponse:
        orch: Orchestrator = app.state.orchestrator
        return HealthResponse(status="ok", version=__version__, agents=len(orch.registry))

    app.include_router(agents.router)
    app.include_router(tasks.router)
    app.include_router(orchestration.router)
    app.include_router(admin.router)
    return app
