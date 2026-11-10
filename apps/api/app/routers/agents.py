from fastapi import APIRouter, Depends

from app.auth import Principal, get_principal
from app.executives.cmo import CMO_PACK

router = APIRouter(prefix="/api/v1", tags=["agents"])


@router.get("/agents")
async def list_agents(principal: Principal = Depends(get_principal)) -> dict:
    _ = principal
    return {
        "orchestrator": {
            "agent_key": "orchestrator",
            "name": "Luxor9 Orchestrator",
            "level": "orchestrator",
        },
        "packs": [CMO_PACK],
        "roadmap_stubs": [
            {"pack": "cfo", "status": "roadmap"},
            {"pack": "coo", "status": "roadmap"},
        ],
    }
