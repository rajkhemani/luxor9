"""Agent registry: registration, capability discovery, task resolution."""

from luxor9.agents.roster import build_default_agents
from luxor9.core.agent_registry import AgentRegistry
from luxor9.shared.enums import AgentType, Capability
from luxor9.shared.models import Task


def _registry() -> AgentRegistry:
    registry = AgentRegistry()
    for agent in build_default_agents():
        registry.register(agent)
    return registry


def test_all_twelve_agents_registered():
    registry = _registry()
    assert len(registry) == 12


def test_discovery_by_capability():
    registry = _registry()
    agent = registry.discover(Capability.DATA_ANALYSIS)
    assert agent is not None
    assert agent.agent_type == AgentType.DATA_ANALYST


def test_find_for_task_prefers_explicit_assignment():
    registry = _registry()
    task = Task(title="x", assigned_agent=AgentType.DEVELOPER)
    assert registry.find_for_task(task).agent_type == AgentType.DEVELOPER


def test_find_for_task_falls_back_to_capability():
    registry = _registry()
    task = Task(title="x", required_capability=Capability.GEOSPATIAL)
    assert registry.find_for_task(task).agent_type == AgentType.NAVIGATOR


def test_find_for_task_returns_none_when_unresolvable():
    registry = AgentRegistry()
    assert registry.find_for_task(Task(title="x")) is None
