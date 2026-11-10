"""Mount AG-UI CMO agent — CopilotKit bucket-2 connectivity.

AG-UI standardizes: live stream, mid-run steer/HITL, reconnect/resume,
recursive tool/sub-agent visibility, and mixed structured + unstructured payloads.
"""

from fastapi import APIRouter, FastAPI

router = APIRouter(tags=["agui"])

_CONNECTIVITY = {
    "protocol": "ag-ui",
    "bucket": 2,
    "capabilities": {
        "live_stream": True,
        "human_in_the_loop": True,
        "reconnect_resume": "thread_id + LangGraph checkpointer (Postgres in prod)",
        "recursive_subagents": "CMO → parallel market + competitor → strategy → evaluator",
        "mixed_payloads": "messages + blueprint/report state + tool events",
    },
    "orchestration_bucket": 1,
    "learning_bucket": 3,
    "learning_status": "phase2_copilotkit_intelligence",
}


def mount_agui(app: FastAPI) -> None:
    try:
        from ag_ui_langgraph import LangGraphAgent, add_langgraph_fastapi_endpoint

        from app.intelligence.agui_cmo import get_agui_cmo_graph

        agent = LangGraphAgent(
            name="luxor9_cmo",
            description=(
                "Luxor9 CMO for Real-Estate Developers — blueprint HITL gate then "
                "parallel market/competitor hierarchy streamed over AG-UI"
            ),
            graph=get_agui_cmo_graph(),
        )
        add_langgraph_fastapi_endpoint(app, agent, path="/api/v1/agui/cmo")
    except Exception as exc:  # pragma: no cover - optional dep path
        err = str(exc)

        @router.get("/api/v1/agui/status")
        async def agui_status_disabled():
            return {"enabled": False, "error": err, "connectivity": _CONNECTIVITY}

        app.include_router(router)
        return

    @router.get("/api/v1/agui/status")
    async def agui_status_ok():
        return {
            "enabled": True,
            "agents": [{"name": "luxor9_cmo", "path": "/api/v1/agui/cmo"}],
            "connectivity": _CONNECTIVITY,
            "openbot": "Register this AG-UI URL as a Bot endpoint (bucket-2 shell)",
            "openduet": "Same Bot — proactive skin optional later",
            "intelligence": "Bucket 3 — CopilotKit Intelligence, Phase 2",
        }

    app.include_router(router)
