"""Central orchestration hub coordinating agents, tasks, state, and audit."""

from __future__ import annotations

import asyncio
import time
from typing import Any

from luxor9.agents.base import AgentBase, ExecutionContext
from luxor9.agents.roster import build_default_agents
from luxor9.core.agent_registry import AgentRegistry
from luxor9.core.audit_log import AuditLog
from luxor9.core.state_manager import StateManager
from luxor9.core.task_queue import TaskQueue
from luxor9.mcp.registry import McpRouter
from luxor9.shared.enums import AgentStatus, EventType
from luxor9.shared.models import Task


class Orchestrator:
    """Submits tasks, schedules them against agents, and records everything."""

    def __init__(
        self,
        router: McpRouter | None = None,
        registry: AgentRegistry | None = None,
        queue: TaskQueue | None = None,
        state: StateManager | None = None,
        audit: AuditLog | None = None,
    ) -> None:
        self.router = router or McpRouter()
        self.registry = registry or AgentRegistry()
        self.queue = queue or TaskQueue()
        self.state = state or StateManager()
        self.audit = audit or AuditLog()
        # workflow_id -> ordered task ids, for status lookups after orchestrate().
        self.workflows: dict[str, list[str]] = {}

    # -- setup ------------------------------------------------------------
    def register_agent(self, agent: AgentBase) -> None:
        self.registry.register(agent)
        self.audit.record(
            "register", "agent", actor=agent.agent_type.value, resource_id=agent.agent_type.value
        )

    def bootstrap_default_agents(self) -> None:
        """Register one of each of the 12 specialized agents."""
        for agent in build_default_agents():
            self.register_agent(agent)

    # -- task intake ------------------------------------------------------
    async def submit_task(self, task: Task) -> Task:
        self.queue.add(task)
        await self.state.emit(
            EventType.TASK_SUBMITTED, actor="orchestrator", payload={"task_id": task.id}
        )
        self.audit.record("submit", "task", actor="orchestrator", resource_id=task.id)
        return task

    # -- execution --------------------------------------------------------
    async def run(self) -> dict[str, Any]:
        """Drive the task DAG to completion and return ``{task_id: result}``.

        Each scheduling round runs all parallel-safe ready tasks concurrently,
        then any sequential tasks one at a time. The loop ends when no further
        task can be scheduled (all done, failed, or blocked).
        """
        self.queue.validate()
        while True:
            ready = self.queue.ready()
            if not ready:
                break
            parallel = [t for t in ready if t.is_parallel]
            sequential = [t for t in ready if not t.is_parallel]
            if parallel:
                await asyncio.gather(*(self._execute_task(t) for t in parallel))
            for task in sequential:
                await self._execute_task(task)
        return self.queue.results()

    async def orchestrate(
        self, tasks: list[Task], workflow_id: str | None = None
    ) -> dict[str, Any]:
        """Submit a batch of tasks, run them to completion, and record the workflow.

        If ``workflow_id`` is given the task ids are stored under it for later
        status lookups via :attr:`workflows`.
        """
        await self.state.emit(EventType.WORKFLOW_STARTED, actor="orchestrator")
        for task in tasks:
            await self.submit_task(task)
        if workflow_id is not None:
            self.workflows[workflow_id] = [t.id for t in tasks]
        results = await self.run()
        await self.state.emit(EventType.WORKFLOW_COMPLETED, actor="orchestrator")
        return results

    async def _execute_task(self, task: Task) -> None:
        agent = self.registry.find_for_task(task)
        if agent is None:
            self.queue.mark_failed(task.id, "no agent available for task")
            await self.state.emit(
                EventType.TASK_FAILED,
                actor="orchestrator",
                payload={"task_id": task.id, "error": "no agent"},
            )
            return

        dependencies = {dep_id: self._dependency_result(dep_id) for dep_id in task.dependencies}
        context = ExecutionContext(task=task, router=self.router, dependencies=dependencies)

        self.queue.mark_running(task.id)
        agent.status = AgentStatus.ACTIVE
        agent.current_task_id = task.id
        await self.state.emit(
            EventType.TASK_STARTED,
            actor=agent.agent_type.value,
            payload={"task_id": task.id},
        )

        started = time.perf_counter()
        try:
            result = await asyncio.wait_for(
                agent.execute(context), timeout=agent.resource_limits.timeout_seconds
            )
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            self.queue.mark_completed(task.id, result, elapsed_ms)
            agent.status = AgentStatus.IDLE
            await self.state.emit(
                EventType.TASK_COMPLETED,
                actor=agent.agent_type.value,
                payload={"task_id": task.id, "execution_time_ms": elapsed_ms},
            )
            self.audit.record("complete", "task", actor=agent.agent_type.value, resource_id=task.id)
        except Exception as exc:  # noqa: BLE001 - surface failure as task state + event
            self.queue.mark_failed(task.id, str(exc))
            agent.status = AgentStatus.ERROR
            await self.state.emit(
                EventType.TASK_FAILED,
                actor=agent.agent_type.value,
                payload={"task_id": task.id, "error": str(exc)},
            )
            self.audit.record(
                "fail",
                "task",
                actor=agent.agent_type.value,
                resource_id=task.id,
                delta={"error": str(exc)},
            )
        finally:
            agent.current_task_id = None
            if agent.status == AgentStatus.ACTIVE:
                agent.status = AgentStatus.IDLE

    def _dependency_result(self, dep_id: str) -> Any:
        dep = self.queue.get(dep_id)
        return dep.result if dep is not None else None
