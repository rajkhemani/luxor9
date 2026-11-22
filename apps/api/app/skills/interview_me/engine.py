"""Deterministic Interview Me engine for Luxor chat.

Pattern source: Addy Osmani interview-me (one question + guess at a time,
confidence gate, explicit yes before any downstream work).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.skills.interview_me.guardrails import InterviewGuardrails
from app.skills.interview_me.templates import questions_for

_YES = {"yes", "yes.", "y", "confirm", "confirmed", "looks right", "that's right", "thats right"}
_NO = {"no", "no.", "n", "refine", "not quite", "wrong"}
_MIN_ANSWER_LEN = 3


@dataclass
class InterviewResult:
    reply: str
    awaiting: str  # interview_answer | interview_confirm | interview_ready
    state: dict[str, Any]
    ready_for_automation: bool = False


def _substantive_answers(state: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        a
        for a in (state.get("answers") or [])
        if len(str(a.get("text") or "").strip()) >= _MIN_ANSWER_LEN
    ]


def _bump_confidence(state: dict[str, Any], guardrails: InterviewGuardrails) -> int:
    substantive = _substantive_answers(state)
    filled = len(
        [
            v
            for v in (state.get("statement") or {}).values()
            if isinstance(v, str) and len(v.strip()) >= _MIN_ANSWER_LEN
        ]
    )
    # Confidence rises only from substantive answers + filled intent fields.
    base = 25 + len(substantive) * 15 + filled * 8
    return min(99, base)


def _format_question(q_text: str, guess: str, hypothesis: str, confidence: int, reason: str) -> str:
    conf_line = f"CONFIDENCE: ~{confidence}%"
    if confidence < 70 and reason:
        conf_line += f" — {reason}"
    return (
        f"HYPOTHESIS: {hypothesis}\n"
        f"{conf_line}\n\n"
        f"Q: {q_text}\n"
        f"GUESS: {guess}"
    )


def _format_restate(statement: dict[str, str], confidence: int) -> str:
    return (
        f"Here's what I now think you want (confidence ~{confidence}%):\n\n"
        f"- Outcome:      {statement.get('outcome', '—')}\n"
        f"- User:         {statement.get('user', '—')}\n"
        f"- Why now:      {statement.get('why_now', '—')}\n"
        f"- Success:      {statement.get('success', '—')}\n"
        f"- Constraint:   {statement.get('constraint', '—')}\n"
        f"- Out of scope: {statement.get('out_of_scope', '—')}\n\n"
        "Yes / no / refine?"
    )


def _apply_keyword_fields(statement: dict[str, str], message: str, *, overwrite: bool) -> None:
    lower = message.lower()
    text = message.strip()

    def set_field(key: str) -> None:
        if overwrite or not statement.get(key):
            statement[key] = text

    if "outcome is" in lower or "outcome:" in lower:
        set_field("outcome")
    if "sandbox" in lower or "no live" in lower:
        set_field("constraint")
    if "out of scope" in lower or "not doing" in lower:
        set_field("out_of_scope")
    if "success" in lower or "evidence" in lower:
        set_field("success")
    if "for our" in lower or "sales" in lower or "marketing" in lower or "c-suite" in lower:
        set_field("user")


def _ingest_answer(
    state: dict[str, Any], message: str, field: str | None, *, overwrite: bool = False
) -> None:
    answers = list(state.get("answers") or [])
    answers.append({"field": field, "text": message.strip()})
    state["answers"] = answers
    statement = dict(state.get("statement") or {})
    if field:
        statement[field] = message.strip()
    _apply_keyword_fields(statement, message, overwrite=overwrite)
    state["statement"] = statement


class InterviewEngine:
    def __init__(self, guardrails: InterviewGuardrails):
        self.guardrails = guardrails
        self.questions = questions_for(guardrails.category)
        self.effective_min = min(guardrails.min_questions, max(1, len(self.questions)))

    def start(self, objective: str) -> InterviewResult:
        q0 = self.questions[0]
        hypothesis = (
            f"You want governed automation for: {objective[:180]}. "
            "I'll confirm who it's for, success, and constraints before drafting a blueprint."
        )
        confidence = 30
        reason = "missing: who it's for, what success looks like, and binding constraints"
        state = {
            "skill": "interview_me",
            "phase": "questioning",
            "hypothesis": hypothesis,
            "confidence": confidence,
            "questions_asked": 1,
            "pending_field": q0.field,
            "asked_ids": [q0.id],
            "answers": [],
            "statement": {},
            "objective": objective,
            "guardrails": self.guardrails.to_dict(),
        }
        reply = _format_question(q0.prompt, q0.guess, hypothesis, confidence, reason)
        return InterviewResult(reply=reply, awaiting="interview_answer", state=state)

    def _enter_restate(self, state: dict[str, Any]) -> InterviewResult:
        statement = dict(state.get("statement") or {})
        # Defaults only as last-resort fillers once gates allow restate.
        statement.setdefault("outcome", state.get("objective", ""))
        statement.setdefault("why_now", "Developer requested automation now.")
        statement.setdefault("user", "Developer launch team")
        statement.setdefault("success", "Evidence-backed automation ready for Trust approval")
        statement.setdefault("constraint", "Sandbox-only until approved")
        statement.setdefault("out_of_scope", "Live spend / CRM writes")
        state["statement"] = statement
        state["phase"] = "restate"
        state["pending_field"] = None
        reply = _format_restate(statement, int(state["confidence"]))
        if not self.guardrails.require_explicit_yes:
            state["phase"] = "confirmed"
            return InterviewResult(
                reply=reply + "\n\n(Explicit yes not required by guardrails — ready.)",
                awaiting="interview_ready",
                state=state,
                ready_for_automation=True,
            )
        return InterviewResult(reply=reply, awaiting="interview_confirm", state=state)

    def continue_(self, state: dict[str, Any], message: str) -> InterviewResult:
        state = dict(state)
        phase = state.get("phase", "questioning")
        text = message.strip()
        lower = text.lower()

        if phase == "confirmed":
            # Idempotent: confirmation already locked; caller should attach blueprint.
            return InterviewResult(
                reply="Intent already confirmed — drafting or refreshing the blueprint.",
                awaiting="interview_ready",
                state=state,
                ready_for_automation=True,
            )

        if phase == "restate":
            # Exact confirmation only — "yes — please change X" is a refinement.
            if lower in _YES:
                state["phase"] = "confirmed"
                state["confidence"] = max(
                    int(state.get("confidence", 0)), self.guardrails.confidence_threshold
                )
                statement = state.get("statement") or {}
                reply = (
                    "Confirmed. I'll now draft the governed blueprint from this intent — "
                    "no automation runs until you approve that blueprint.\n\n"
                    f"Intent locked: {statement.get('outcome', state.get('objective', ''))}"
                )
                return InterviewResult(
                    reply=reply,
                    awaiting="interview_ready",
                    state=state,
                    ready_for_automation=True,
                )
            if lower in _NO or "refine" in lower:
                state["phase"] = "questioning"
                state["confidence"] = max(40, int(state.get("confidence", 50)) - 15)
                asked_ids = list(state.get("asked_ids") or [])
                next_q = next((q for q in self.questions if q.id not in asked_ids), None)
                if next_q is None:
                    state["phase"] = "restate"
                    reply = (
                        "Understood — tell me what to change in the intent summary.\n\n"
                        + _format_restate(
                            state.get("statement") or {}, int(state["confidence"])
                        )
                    )
                    return InterviewResult(
                        reply=reply, awaiting="interview_confirm", state=state
                    )
                asked_n = int(state.get("questions_asked", 0))
                asked_ids.append(next_q.id)
                state["asked_ids"] = asked_ids
                state["questions_asked"] = asked_n + 1
                state["pending_field"] = next_q.field
                reason = "prior summary rejected — clarifying further"
                reply = _format_question(
                    next_q.prompt,
                    next_q.guess,
                    state.get("hypothesis", ""),
                    int(state["confidence"]),
                    reason,
                )
                return InterviewResult(
                    reply=reply, awaiting="interview_answer", state=state
                )
            # Treat as refinement note (including yes-prefix elaborations)
            _ingest_answer(state, text, None, overwrite=True)
            state["confidence"] = _bump_confidence(state, self.guardrails)
            reply = _format_restate(state.get("statement") or {}, int(state["confidence"]))
            return InterviewResult(reply=reply, awaiting="interview_confirm", state=state)

        # Normal Q&A turn — reject whitespace-only answers.
        if len(text) < _MIN_ANSWER_LEN:
            reply = (
                "I need a short substantive answer (at least a few words) before we continue.\n\n"
                f"Pending: {state.get('pending_field') or 'intent detail'}"
            )
            return InterviewResult(reply=reply, awaiting="interview_answer", state=state)

        pending = state.get("pending_field")
        _ingest_answer(state, text, pending)
        state["confidence"] = _bump_confidence(state, self.guardrails)
        asked_ids = list(state.get("asked_ids") or [])
        asked_n = int(state.get("questions_asked", 0))

        can_stop = (
            asked_n >= self.effective_min
            and int(state["confidence"]) >= self.guardrails.confidence_threshold
        )
        # Soft stop at max questions
        if asked_n >= self.guardrails.max_questions:
            can_stop = True

        if can_stop:
            return self._enter_restate(state)

        # Next question
        next_q = next((q for q in self.questions if q.id not in asked_ids), None)
        if next_q is None:
            # Templates exhausted: only restate when gates (effective min + confidence) pass,
            # otherwise solicit a free-form clarification.
            if (
                asked_n >= self.effective_min
                and int(state["confidence"]) >= self.guardrails.confidence_threshold
            ) or asked_n >= self.guardrails.max_questions:
                return self._enter_restate(state)
            state["pending_field"] = None
            state["phase"] = "questioning"
            reply = (
                "I still need clearer intent before confirming. "
                "In one short paragraph, who is this for, what success looks like, "
                "and any hard constraints?"
            )
            return InterviewResult(reply=reply, awaiting="interview_answer", state=state)

        asked_ids.append(next_q.id)
        state["asked_ids"] = asked_ids
        state["questions_asked"] = asked_n + 1
        state["pending_field"] = next_q.field
        state["phase"] = "questioning"
        reason = "still clarifying remaining intent fields"
        if int(state["confidence"]) >= 70:
            reason = ""
        reply = _format_question(
            next_q.prompt,
            next_q.guess,
            state.get("hypothesis", ""),
            int(state["confidence"]),
            reason,
        )
        return InterviewResult(reply=reply, awaiting="interview_answer", state=state)
