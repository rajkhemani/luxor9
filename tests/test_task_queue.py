"""Task queue: dependency resolution, validation, and failure cascades."""

import pytest

from luxor9.core.task_queue import TaskQueue, TaskQueueError
from luxor9.shared.enums import TaskStatus
from luxor9.shared.models import Task


def test_ready_respects_dependencies():
    queue = TaskQueue()
    a = Task(title="a")
    b = Task(title="b", dependencies=[a.id])
    queue.add_many([a, b])

    ready = queue.ready()
    assert [t.id for t in ready] == [a.id]  # b is gated on a

    queue.mark_running(a.id)
    queue.mark_completed(a.id, "done")
    ready = queue.ready()
    assert [t.id for t in ready] == [b.id]


def test_ready_marks_tasks_so_they_are_not_returned_twice():
    queue = TaskQueue()
    a = Task(title="a")
    queue.add(a)
    assert queue.ready() == [a]
    assert queue.ready() == []  # already advanced to READY


def test_validate_detects_missing_dependency():
    queue = TaskQueue()
    queue.add(Task(title="a", dependencies=["does-not-exist"]))
    with pytest.raises(TaskQueueError):
        queue.validate()


def test_validate_detects_cycle():
    queue = TaskQueue()
    a = Task(title="a")
    b = Task(title="b", dependencies=[a.id])
    a.dependencies = [b.id]  # introduce a cycle
    queue.add_many([a, b])
    with pytest.raises(TaskQueueError):
        queue.validate()


def test_failure_cascades_to_dependents():
    queue = TaskQueue()
    a = Task(title="a")
    b = Task(title="b", dependencies=[a.id])
    c = Task(title="c", dependencies=[b.id])
    queue.add_many([a, b, c])

    queue.mark_running(a.id)
    queue.mark_failed(a.id, "boom")

    assert queue.get(b.id).status == TaskStatus.BLOCKED
    assert queue.get(c.id).status == TaskStatus.BLOCKED
    assert queue.is_complete()
