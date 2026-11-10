from __future__ import annotations

from app.adapters import research

CMO_PACK = {
    "pack": "cmo_re",
    "name": "LUXOR9 CMO — Real Estate",
    "executive": {
        "agent_key": "cmo_executive",
        "name": "CMO Executive",
        "level": "executive",
    },
    "specialists": [
        {"agent_key": "market_researcher", "name": "Market Researcher", "topic": "market intelligence"},
        {
            "agent_key": "competitor_analyst",
            "name": "Competitor Analyst",
            "topic": "competitor intelligence",
        },
        {
            "agent_key": "strategy_writer",
            "name": "Strategy Writer",
            "topic": "launch strategy",
        },
        {"agent_key": "evaluator", "name": "Evaluator", "topic": "evaluation"},
    ],
}


def build_blueprint(objective: str, context: dict) -> dict:
    location = context.get("location", "Dubai")
    product_type = context.get("product_type", "residential")
    return {
        "title": f"Market-to-Launch Intelligence — {location}",
        "summary": (
            f"Blueprint for a governed CMO workflow covering market research, "
            f"competitor analysis and launch strategy for {product_type} in {location}."
        ),
        "plan": {
            "objective": objective,
            "context": context,
            "stages": [
                {
                    "id": "market",
                    "agent": "market_researcher",
                    "goal": "Produce sourced market opportunity findings",
                },
                {
                    "id": "competitor",
                    "agent": "competitor_analyst",
                    "goal": "Produce competitor positioning analysis",
                    "parallel_with": ["market"],
                },
                {
                    "id": "strategy",
                    "agent": "strategy_writer",
                    "goal": "Assemble launch strategy with assumptions and risks",
                    "depends_on": ["market", "competitor"],
                },
                {
                    "id": "evaluate",
                    "agent": "evaluator",
                    "goal": "Flag unsupported, conflicting or stale claims",
                    "depends_on": ["strategy"],
                },
            ],
            "human_gates": [
                {"id": "blueprint_approval", "description": "Customer approves blueprint"},
                {
                    "id": "campaign_publish",
                    "description": "Approver required before sandbox campaign publish",
                },
            ],
        },
    }


async def run_specialist(agent_key: str, objective: str, context: dict) -> dict:
    topic_map = {s["agent_key"]: s["topic"] for s in CMO_PACK["specialists"]}
    topic = topic_map.get(agent_key, "general")
    if agent_key == "evaluator":
        return {
            "agent_key": agent_key,
            "findings": [],
            "evaluation": {
                "unsupported_claim_policy": "mark_UNVERIFIED",
                "conflict_policy": "mark_CONFLICTING",
            },
        }
    if agent_key == "strategy_writer":
        return {
            "agent_key": agent_key,
            "strategy": {
                "positioning": context.get("positioning_hint", "Premium waterfront living"),
                "assumptions": [
                    "Demand remains resilient in target submarket",
                    "Competitor launches do not flood the same price band in the next quarter",
                ],
                "risks": ["Interest rate sensitivity", "Supply surge in adjacent communities"],
                "opportunities": [
                    "Differentiate on lifestyle amenities and payment plans",
                    "Target GCC and South Asian HNW segments",
                ],
            },
            "model_gaps": [
                {
                    "claim_text": "Absorptions will exceed 70% in launch month",
                    "status": "UNVERIFIED",
                    "reason": "model_inference_without_source",
                }
            ],
        }

    sources = await research.fetch_public_sources(objective, topic)
    claims = []
    for src in sources:
        claims.append(
            {
                "claim_text": src["excerpt"][:240],
                "claim_type": topic.split()[0],
                "status": "VERIFIED",
                "confidence": 0.7,
                "source": src,
            }
        )
    return {"agent_key": agent_key, "sources": sources, "claims": claims}
