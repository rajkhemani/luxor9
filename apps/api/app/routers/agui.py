"""Mount AG-UI CMO agent for CopilotKit / OpenBot."""

from fastapi import APIRouter, FastAPI

router = APIRouter(tags=["agui"])


def mount_agui(app: FastAPI) -> None:
    try:
        from ag_ui_langgraph import LangGraphAgent, add_langgraph_fastapi_endpoint

        from app.intelligence.agui_cmo import get_agui_cmo_graph

        agent = LangGraphAgent(
            name="luxor9_cmo",
            description=(
                "Luxor9 CMO for Real-Estate Developers — blueprint gate then "
                "parallel market/competitor hierarchy"
            ),
            graph=get_agui_cmo_graph(),
        )
        add_langgraph_fastapi_endpoint(app, agent, path="/api/v1/agui/cmo")
    except Exception as exc:  # pragma: no cover - optional dep path
        err = str(exc)

        @router.get("/api/v1/agui/status")
        async def agui_status_disabled():
            return {"enabled": False, "error": err}

        app.include_router(router)
        return

    @router.get("/api/v1/agui/status")
    async def agui_status_ok():
        return {
            "enabled": True,
            "agents": [{"name": "luxor9_cmo", "path": "/api/v1/agui/cmo"}],
            "openbot": "Register this AG-UI URL as a Bot endpoint",
            "openduet": "Same Bot — proactive skin optional later",
        }

    app.include_router(router)
