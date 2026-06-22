"""Append-only audit trail for compliance and debugging."""

from __future__ import annotations

from typing import Any

from luxor9.shared.models import AuditRecord


class AuditLog:
    """In-memory, append-only log. Records are never mutated or deleted."""

    def __init__(self) -> None:
        self._records: list[AuditRecord] = []

    def record(
        self,
        action: str,
        resource_type: str,
        *,
        actor: str | None = None,
        resource_id: str | None = None,
        delta: dict[str, Any] | None = None,
    ) -> AuditRecord:
        entry = AuditRecord(
            actor=actor,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            delta=delta or {},
        )
        self._records.append(entry)
        return entry

    def all(self) -> list[AuditRecord]:
        return list(self._records)

    def for_resource(self, resource_id: str) -> list[AuditRecord]:
        return [r for r in self._records if r.resource_id == resource_id]

    def __len__(self) -> int:
        return len(self._records)
