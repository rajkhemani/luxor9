"""Configurable guardrails for the Interview Me skill."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True)
class InterviewGuardrails:
    """Caller-tunable gates before automation may be created."""

    enabled: bool = True
    min_questions: int = 3
    confidence_threshold: int = 95
    require_explicit_yes: bool = True
    category: str = "b2b_real_estate"
    max_questions: int = 12

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def resolve_guardrails(context: dict[str, Any] | None = None) -> InterviewGuardrails:
    """Merge request context overrides onto defaults.

    Callers pass ``context.interview_guardrails`` from chat / demo clients.
    """
    context = context or {}
    raw = dict(context.get("interview_guardrails") or {})
    return InterviewGuardrails(
        enabled=bool(raw.get("enabled", True)),
        min_questions=max(1, int(raw.get("min_questions", 3))),
        confidence_threshold=min(100, max(50, int(raw.get("confidence_threshold", 95)))),
        require_explicit_yes=bool(raw.get("require_explicit_yes", True)),
        category=str(raw.get("category", "b2b_real_estate")),
        max_questions=max(2, int(raw.get("max_questions", 12))),
    )
