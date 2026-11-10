import pytest
from langgraph.checkpoint.base import BaseCheckpointSaver

from app.intelligence.agui_cmo import get_agui_cmo_graph, reset_agui_cmo_graph_for_tests


@pytest.fixture(autouse=True)
def _fresh_graph():
    reset_agui_cmo_graph_for_tests()
    yield
    reset_agui_cmo_graph_for_tests()


def test_agui_cmo_graph_has_checkpointer():
    graph = get_agui_cmo_graph()
    assert isinstance(graph.checkpointer, BaseCheckpointSaver)


@pytest.mark.asyncio
async def test_agui_cmo_graph_aget_state_with_thread():
    graph = get_agui_cmo_graph()
    config = {"configurable": {"thread_id": "test-thread-copilot"}}
    state = await graph.aget_state(config)
    assert state is not None
