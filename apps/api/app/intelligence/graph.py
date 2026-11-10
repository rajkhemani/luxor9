"""LangGraph hierarchical workflow: Orchestrator → CMO → parallel specialists."""

from __future__ import annotations

import asyncio
from typing import Any, TypedDict

from app.executives import cmo


class GraphState(TypedDict, total=False):
    objective: str
    context: dict[str, Any]
    market: dict[str, Any]
    competitor: dict[str, Any]
    strategy: dict[str, Any]
    evaluation: dict[str, Any]
    report: dict[str, Any]


async def _research_parallel(state: GraphState) -> dict:
    market_task = cmo.run_specialist(
        "market_researcher", state["objective"], state.get("context", {})
    )
    competitor_task = cmo.run_specialist(
        "competitor_analyst", state["objective"], state.get("context", {})
    )
    market, competitor = await asyncio.gather(market_task, competitor_task)
    return {"market": market, "competitor": competitor}


async def _strategy_node(state: GraphState) -> dict:
    merged_context = {
        **state.get("context", {}),
        "market_summary": state.get("market"),
        "competitor_summary": state.get("competitor"),
    }
    result = await cmo.run_specialist("strategy_writer", state["objective"], merged_context)
    return {"strategy": result}


async def _evaluator_node(state: GraphState) -> dict:
    result = await cmo.run_specialist("evaluator", state["objective"], state.get("context", {}))
    return {"evaluation": result}


async def _assemble_report(state: GraphState) -> dict:
    claims = []
    sources = []
    for block in (state.get("market"), state.get("competitor")):
        if not block:
            continue
        sources.extend(block.get("sources", []))
        claims.extend(block.get("claims", []))
    for gap in (state.get("strategy") or {}).get("model_gaps", []):
        claims.append(
            {
                "claim_text": gap["claim_text"],
                "claim_type": "forecast",
                "status": gap.get("status", "UNVERIFIED"),
                "confidence": 0.2,
                "source": None,
            }
        )
    report = {
        "title": "Market-to-Launch Intelligence Report",
        "objective": state["objective"],
        "market": state.get("market"),
        "competitor": state.get("competitor"),
        "strategy": (state.get("strategy") or {}).get("strategy"),
        "evaluation": state.get("evaluation"),
        "claims": claims,
        "sources": sources,
        "proposed_action": {
            "action": "campaign_publish",
            "resource_type": "campaign",
            "resource_id": "draft-launch-1",
            "payload": {
                "channel": "sandbox",
                "headline": "Launch campaign draft",
                "workflow_objective": state["objective"][:200],
            },
        },
    }
    return {"report": report}


def build_cmo_graph():
    """Build LangGraph StateGraph when available; fall back to sequential runner."""
    try:
        from langgraph.graph import END, START, StateGraph

        graph = StateGraph(GraphState)
        graph.add_node("research", _research_parallel)
        graph.add_node("strategy", _strategy_node)
        graph.add_node("evaluator", _evaluator_node)
        graph.add_node("assemble", _assemble_report)

        graph.add_edge(START, "research")
        graph.add_edge("research", "strategy")
        graph.add_edge("strategy", "evaluator")
        graph.add_edge("evaluator", "assemble")
        graph.add_edge("assemble", END)
        return graph.compile()
    except Exception:
        return None


async def run_cmo_hierarchy(objective: str, context: dict | None = None) -> dict:
    state: GraphState = {"objective": objective, "context": context or {}}
    compiled = build_cmo_graph()
    if compiled is not None:
        result = await compiled.ainvoke(state)
        return result

    state = {**state, **(await _research_parallel(state))}
    state = {**state, **(await _strategy_node(state))}
    state = {**state, **(await _evaluator_node(state))}
    state = {**state, **(await _assemble_report(state))}
    return state
