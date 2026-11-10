"""AG-UI CMO chat graph — bucket-2 connectivity over bucket-1 orchestration.

LangGraph owns the hierarchy (bucket 1). This module exposes it on AG-UI so
CopilotKit can stream turns, accept HITL (approve/decline), carry structured
state (blueprint/report) beside messages, and later resume via checkpointer.

Trust Engine remains authority for campaign publish.
"""

from __future__ import annotations

from typing import Annotated, Any, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

from app.executives import cmo
from app.intelligence.graph import run_cmo_hierarchy

_APPROVE = {"approve", "yes", "approve blueprint", "run", "go", "proceed"}
_DECLINE = {"decline", "no", "reject", "cancel", "stop"}


class CmoChatState(TypedDict, total=False):
    messages: Annotated[list[BaseMessage], add_messages]
    context: dict[str, Any]
    blueprint: dict[str, Any]
    report: dict[str, Any]


def _user_texts(messages: list[BaseMessage]) -> list[str]:
    out: list[str] = []
    for msg in messages:
        if isinstance(msg, HumanMessage) or getattr(msg, "type", "") == "human":
            content = msg.content
            out.append(content if isinstance(content, str) else str(content))
    return out


def _last_user_text(messages: list[BaseMessage]) -> str:
    texts = _user_texts(messages)
    return texts[-1] if texts else "Dubai real-estate market-to-launch intelligence"


def _objective(messages: list[BaseMessage]) -> str:
    texts = _user_texts(messages)
    for t in texts:
        if t.strip().lower() not in _APPROVE | _DECLINE:
            return t
    return texts[0] if texts else "Dubai real-estate market-to-launch intelligence"


async def draft_blueprint_node(state: CmoChatState) -> dict:
    objective = _objective(state.get("messages") or [])
    context = state.get("context") or {"location": "Dubai", "product_type": "residential"}
    draft = cmo.build_blueprint(objective, context)
    reply = (
        f"**Blueprint ready:** {draft['title']}\n\n"
        f"{draft['summary']}\n\n"
        "Specialists (parallel): market researcher + competitor analyst → strategy → evaluator.\n"
        "Reply **approve** to dispatch, or **decline** to stop."
    )
    return {
        "blueprint": draft,
        "context": {**context, "objective": objective},
        "messages": [AIMessage(content=reply)],
    }


async def execute_or_decline_node(state: CmoChatState) -> dict:
    text = _last_user_text(state.get("messages") or []).strip().lower()
    if text in _DECLINE:
        return {"messages": [AIMessage(content="Blueprint declined. No agents were dispatched.")]}

    if text not in _APPROVE:
        bp = state.get("blueprint") or {}
        return {
            "messages": [
                AIMessage(
                    content=(
                        "Awaiting blueprint decision. "
                        f"Proposed: {bp.get('title', 'CMO plan')}. "
                        "Reply **approve** or **decline**."
                    )
                )
            ]
        }

    objective = (state.get("context") or {}).get("objective") or _objective(
        state.get("messages") or []
    )
    result = await run_cmo_hierarchy(objective, state.get("context") or {})
    report = result.get("report") or {}
    claims = report.get("claims") or []
    verified = sum(1 for c in claims if c.get("status") == "VERIFIED")
    unverified = sum(1 for c in claims if c.get("status") == "UNVERIFIED")
    sources = len(report.get("sources") or [])
    summary = (
        f"**CMO hierarchy complete** (parallel market + competitor).\n\n"
        f"- Sources: {sources}\n"
        f"- Verified claims: {verified}\n"
        f"- Unverified gaps: {unverified}\n\n"
        "Open Control Tower → workflows for evidence. "
        "Campaign publish stays Trust-Engine gated (sandbox in MVP)."
    )
    return {"report": report, "messages": [AIMessage(content=summary)]}


def route_start(state: CmoChatState) -> str:
    last = _last_user_text(state.get("messages") or []).strip().lower()
    if last in _APPROVE | _DECLINE:
        return "execute"
    return "draft"


def build_agui_cmo_graph():
    graph = StateGraph(CmoChatState)
    graph.add_node("draft", draft_blueprint_node)
    graph.add_node("execute", execute_or_decline_node)
    graph.add_conditional_edges(START, route_start, {"draft": "draft", "execute": "execute"})
    graph.add_edge("draft", END)
    graph.add_edge("execute", END)
    return graph.compile()


_AGUI_GRAPH = None


def get_agui_cmo_graph():
    global _AGUI_GRAPH
    if _AGUI_GRAPH is None:
        _AGUI_GRAPH = build_agui_cmo_graph()
    return _AGUI_GRAPH
