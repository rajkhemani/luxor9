"""Event-driven state manager: an in-memory event stream with pub/sub.

This is the in-process implementation of the event bus described in the
roadmap. The interface (``emit`` / ``subscribe`` / ``snapshot``) is designed so a
Redis Streams backend can be dropped in without touching callers.
"""

from __future__ import annotations

import asyncio
from typing import Any

from luxor9.shared.enums import EventType
from luxor9.shared.models import Event


class StateManager:
    def __init__(self) -> None:
        self._events: list[Event] = []
        self._subscribers: list[asyncio.Queue[Event]] = []

    async def emit(
        self,
        event_type: EventType,
        *,
        actor: str | None = None,
        payload: dict[str, Any] | None = None,
    ) -> Event:
        """Append an event to the stream and fan it out to subscribers."""
        event = Event(type=event_type, actor=actor, payload=payload or {})
        self._events.append(event)
        for queue in self._subscribers:
            queue.put_nowait(event)
        return event

    def subscribe(self) -> asyncio.Queue[Event]:
        """Register a subscriber. Returns a queue that receives future events."""
        queue: asyncio.Queue[Event] = asyncio.Queue()
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[Event]) -> None:
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    def events(self) -> list[Event]:
        return list(self._events)

    def snapshot(self) -> dict[str, Any]:
        """Point-in-time aggregate of the event stream, for recovery/dashboards."""
        counts: dict[str, int] = {}
        for event in self._events:
            counts[event.type.value] = counts.get(event.type.value, 0) + 1
        return {"total_events": len(self._events), "counts_by_type": counts}
