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


def _int_field(raw: dict[str, Any], key: str, default: int) -> int:
    value = raw.get(key, default)
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"interview_guardrails.{key} must be an integer") from exc


def _bool_field(raw: dict[str, Any], key: str, default: bool) -> bool:
    if key not in raw:
        return default
    value = raw[key]
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)) and value in (0, 1):
        return bool(value)
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off"}:
            return False
    raise ValueError(f"interview_guardrails.{key} must be a boolean")


def resolve_guardrails(context: dict[str, Any] | None = None) -> InterviewGuardrails:
    """Merge request context overrides onto defaults.

    Callers pass ``context.interview_guardrails`` from chat / demo clients.
    """
    context = context or {}
    raw = dict(context.get("interview_guardrails") or {})
    return InterviewGuardrails(
        enabled=_bool_field(raw, "enabled", True),
        min_questions=max(1, _int_field(raw, "min_questions", 3)),
        confidence_threshold=min(100, max(50, _int_field(raw, "confidence_threshold", 95))),
        require_explicit_yes=_bool_field(raw, "require_explicit_yes", True),
        category=str(raw.get("category", "b2b_real_estate")),
        max_questions=max(2, _int_field(raw, "max_questions", 12)),
    )
