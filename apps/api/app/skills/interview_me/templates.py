"""Category-specific interview question templates.

B2B real estate is the first live category. Additional categories register here
as roadmap stubs without enabling automation packs.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class InterviewQuestion:
    id: str
    prompt: str
    guess: str
    field: str  # maps into statement of intent


B2B_REAL_ESTATE_QUESTIONS: list[InterviewQuestion] = [
    InterviewQuestion(
        id="re_who",
        field="user",
        prompt=(
            "Who is this for inside the developer organisation — sales, marketing, "
            "C-suite, or a specific launch war-room?"
        ),
        guess=(
            "Sales + marketing launch team, because market-to-launch briefs usually "
            "serve that group first."
        ),
    ),
    InterviewQuestion(
        id="re_outcome",
        field="outcome",
        prompt=(
            "What should exist when we are done — a research pack, a publish-ready "
            "campaign draft, an approval trail, or something else?"
        ),
        guess=(
            "An evidence-backed market/competitor launch pack with UNVERIFIED gaps "
            "listed for human review."
        ),
    ),
    InterviewQuestion(
        id="re_success",
        field="success",
        prompt=(
            "How will you know this worked — what does success look like in one sentence?"
        ),
        guess=(
            "Leadership can approve or decline a blueprint with clear evidence and "
            "no silent assumptions."
        ),
    ),
    InterviewQuestion(
        id="re_constraint",
        field="constraint",
        prompt=(
            "What is the binding constraint — timeline, sandbox-only publish, brand "
            "compliance, budget, or data residency?"
        ),
        guess="Sandbox only — no live ad spend or customer messaging without Trust approval.",
    ),
    InterviewQuestion(
        id="re_out_of_scope",
        field="out_of_scope",
        prompt=(
            "What are we explicitly NOT doing in this run — CRM writes, live WhatsApp "
            "blasts, production media spend?"
        ),
        guess="No CRM mutation and no live channel publish; sandbox campaign pack only.",
    ),
    InterviewQuestion(
        id="re_why_now",
        field="why_now",
        prompt="Why now — what changed that makes this launch brief urgent?",
        guess="A Q2 residential launch window on a named Dubai project.",
    ),
]


CATEGORY_TEMPLATES: dict[str, list[InterviewQuestion]] = {
    "b2b_real_estate": B2B_REAL_ESTATE_QUESTIONS,
    # Roadmap stubs — same engine, no live packs yet
    "hospitality": B2B_REAL_ESTATE_QUESTIONS,  # placeholder reuse until pack ships
    "financial_services": B2B_REAL_ESTATE_QUESTIONS,
}


def questions_for(category: str) -> list[InterviewQuestion]:
    return list(CATEGORY_TEMPLATES.get(category, B2B_REAL_ESTATE_QUESTIONS))
