"""End-to-end orchestration: DAG execution, events, audit, and failures."""

from luxor9.core.orchestrator import Orchestrator
from luxor9.shared.enums import AgentType, EventType, TaskStatus
from luxor9.shared.models import Task


def _orchestrator() -> Orchestrator:
    orch = Orchestrator()
    orch.bootstrap_default_agents()
    return orch


async def test_dag_runs_to_completion_with_dependencies():
    orch = _orchestrator()
    analyze = Task(
        title="aggregate",
        assigned_agent=AgentType.DATA_ANALYST,
        input={"data": [1, 2, 3, 4]},
    )
    report = Task(
        title="summarize",
        assigned_agent=AgentType.OVERSEER,
        dependencies=[analyze.id],
        is_parallel=False,
    )
    results = await orch.orchestrate([analyze, report])

    assert orch.queue.get(analyze.id).status == TaskStatus.COMPLETED
    assert orch.queue.get(report.id).status == TaskStatus.COMPLETED
    assert results[analyze.id]["stats"]["sum"] == 10
    assert "plan" in results[report.id]


async def test_dependency_results_are_passed_into_context():
    orch = _orchestrator()
    seen = {}

    async def capture(context):
        seen["deps"] = dict(context.dependencies)
        return {"ok": True}

    upstream = Task(title="up", assigned_agent=AgentType.SPEEDSTER, input={"text": "hi"})
    downstream = Task(title="down", assigned_agent=AgentType.DEVELOPER, dependencies=[upstream.id])
    # Monkeypatch the developer agent's execute to inspect the context.
    orch.registry.get(AgentType.DEVELOPER).execute = capture  # type: ignore[method-assign]

    await orch.orchestrate([upstream, downstream])
    assert upstream.id in seen["deps"]
    assert seen["deps"][upstream.id]["echo"] == "hi"


async def test_events_and_audit_are_recorded():
    orch = _orchestrator()
    task = Task(title="x", assigned_agent=AgentType.SPEEDSTER, input={"text": "y"})
    await orch.orchestrate([task])

    counts = orch.state.snapshot()["counts_by_type"]
    assert counts[EventType.TASK_COMPLETED.value] == 1
    assert counts[EventType.WORKFLOW_STARTED.value] == 1
    assert len(orch.audit) >= 1


async def test_unresolvable_task_fails_and_blocks_dependents():
    orch = _orchestrator()
    # No assigned_agent and no capability -> unresolvable.
    bad = Task(title="orphan")
    dependent = Task(title="needs-bad", assigned_agent=AgentType.SPEEDSTER, dependencies=[bad.id])
    await orch.orchestrate([bad, dependent])

    assert orch.queue.get(bad.id).status == TaskStatus.FAILED
    assert orch.queue.get(dependent.id).status == TaskStatus.BLOCKED
