"""Agent behavior: deterministic computation and MCP-backed execution."""

from luxor9.agents.base import ExecutionContext
from luxor9.agents.roster import build_default_agents
from luxor9.agents.specialized import (
    DataAnalystAgent,
    NavigatorAgent,
    OverseerAgent,
    SpeedsterAgent,
)
from luxor9.mcp.registry import McpRouter
from luxor9.shared.models import Task


def _ctx(task: Task) -> ExecutionContext:
    return ExecutionContext(task=task, router=McpRouter())


def test_roster_has_twelve_unique_agents():
    agents = build_default_agents()
    assert len(agents) == 12
    assert len({a.agent_type for a in agents}) == 12


async def test_data_analyst_computes_statistics():
    task = Task(title="analyze", input={"data": [10, 20, 30]})
    result = await DataAnalystAgent().execute(_ctx(task))
    assert result["stats"]["mean"] == 20
    assert result["stats"]["max"] == 30
    assert result["count"] == 3


async def test_navigator_computes_haversine_distance():
    task = Task(title="route", input={"origin": [0.0, 0.0], "destination": [0.0, 1.0]})
    result = await NavigatorAgent().execute(_ctx(task))
    # 1 degree of longitude at the equator is ~111.19 km.
    assert abs(result["distance_km"] - 111.19) < 1.0


async def test_speedster_transforms_text():
    task = Task(title="t", input={"text": "go"})
    result = await SpeedsterAgent().execute(_ctx(task))
    assert result["upper"] == "GO"
    assert result["length"] == 2


async def test_overseer_uses_mcp_router():
    task = Task(title="plan the launch")
    result = await OverseerAgent().execute(_ctx(task))
    assert "plan" in result
    assert result["plan"].startswith("[mock:")
