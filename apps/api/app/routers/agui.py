"""Mount AG-UI CMO agent — Luxor Kit connectivity (bucket 2).

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
        "reconnect_resume": (
            "thread_id + MemorySaver (MVP process-local); "
            "Postgres checkpointer planned as L9-011 for multi-process resume"
        ),
        "recursive_subagents": "CMO → parallel market + competitor → strategy → evaluator",
        "mixed_payloads": "messages + blueprint/report state + tool events",
    },
    "orchestration_bucket": 1,
    "learning_bucket": 3,
    "learning_status": "phase2_luxor_intelligence",
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
            "coworker_hub": "Register this AG-UI URL as a Coworker Hub bot (bucket-2 shell)",
            "duo_skin": "Same bot — Duo Skin proactive layout optional later",
            "intelligence": "Bucket 3 — Luxor Intelligence, Phase 2",
        }

    app.include_router(router)
