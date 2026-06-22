"""Dependency-resolving task queue.

Tasks form a DAG via ``Task.dependencies``. The queue exposes the set of tasks
whose dependencies are all satisfied, detects cycles and missing references up
front, and cascades a ``BLOCKED`` status to the descendants of any failed task.
"""

from __future__ import annotations

from typing import Any

from luxor9.shared.enums import TaskStatus
from luxor9.shared.models import Task, utcnow

_TERMINAL = {TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED, TaskStatus.BLOCKED}


class TaskQueueError(Exception):
    """Raised for invalid task graphs (missing dependency or cycle)."""


class TaskQueue:
    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}

    # -- mutation ---------------------------------------------------------
    def add(self, task: Task) -> Task:
        self._tasks[task.id] = task
        return task

    def add_many(self, tasks: list[Task]) -> None:
        for task in tasks:
            self.add(task)

    # -- access -----------------------------------------------------------
    def get(self, task_id: str) -> Task | None:
        return self._tasks.get(task_id)

    def all(self) -> list[Task]:
        return list(self._tasks.values())

    # -- validation -------------------------------------------------------
    def validate(self) -> None:
        """Ensure every dependency exists and the graph is acyclic."""
        for task in self._tasks.values():
            for dep in task.dependencies:
                if dep not in self._tasks:
                    raise TaskQueueError(f"task {task.id} depends on unknown task {dep}")
        self._assert_acyclic()

    def _assert_acyclic(self) -> None:
        WHITE, GREY, BLACK = 0, 1, 2
        color = {tid: WHITE for tid in self._tasks}

        def visit(tid: str) -> None:
            color[tid] = GREY
            for dep in self._tasks[tid].dependencies:
                if color[dep] == GREY:
                    raise TaskQueueError(f"dependency cycle detected at task {dep}")
                if color[dep] == WHITE:
                    visit(dep)
            color[tid] = BLACK

        for tid in self._tasks:
            if color[tid] == WHITE:
                visit(tid)

    # -- scheduling -------------------------------------------------------
    def ready(self) -> list[Task]:
        """Return PENDING tasks whose dependencies have all completed.

        Selected tasks are advanced to ``READY`` so repeated calls don't return
        the same task twice.
        """
        out: list[Task] = []
        for task in self._tasks.values():
            if task.status != TaskStatus.PENDING:
                continue
            deps = [self._tasks[d] for d in task.dependencies]
            if any(d.status == TaskStatus.FAILED or d.status == TaskStatus.BLOCKED for d in deps):
                self._block(task)
                continue
            if all(d.status == TaskStatus.COMPLETED for d in deps):
                task.status = TaskStatus.READY
                out.append(task)
        return out

    def mark_running(self, task_id: str) -> None:
        task = self._tasks[task_id]
        task.status = TaskStatus.RUNNING
        task.started_at = utcnow()

    def mark_completed(
        self, task_id: str, result: Any, execution_time_ms: int | None = None
    ) -> None:
        task = self._tasks[task_id]
        task.status = TaskStatus.COMPLETED
        task.result = result
        task.execution_time_ms = execution_time_ms
        task.completed_at = utcnow()

    def mark_failed(self, task_id: str, error: str) -> None:
        task = self._tasks[task_id]
        task.status = TaskStatus.FAILED
        task.error = error
        task.completed_at = utcnow()
        self._cascade_block(task_id)

    def _block(self, task: Task) -> None:
        task.status = TaskStatus.BLOCKED
        task.error = task.error or "blocked by failed dependency"
        self._cascade_block(task.id)

    def _cascade_block(self, failed_id: str) -> None:
        """Block any not-yet-started task that (transitively) depends on ``failed_id``."""
        changed = True
        blocked = {failed_id}
        while changed:
            changed = False
            for task in self._tasks.values():
                if task.status in _TERMINAL or task.status == TaskStatus.RUNNING:
                    continue
                if any(dep in blocked for dep in task.dependencies):
                    task.status = TaskStatus.BLOCKED
                    task.error = task.error or "blocked by failed dependency"
                    blocked.add(task.id)
                    changed = True

    # -- introspection ----------------------------------------------------
    def is_complete(self) -> bool:
        return all(t.status in _TERMINAL for t in self._tasks.values())

    def results(self) -> dict[str, Any]:
        return {t.id: t.result for t in self._tasks.values() if t.status == TaskStatus.COMPLETED}

    def __len__(self) -> int:
        return len(self._tasks)
