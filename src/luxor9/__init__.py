"""LUXOR9 — unified agent orchestration platform.

Public surface:
    Orchestrator      — central coordination hub
    AgentRegistry     — capability-based agent discovery
    TaskQueue         — dependency-resolving task scheduler
    StateManager      — in-memory event bus + snapshots
    McpRouter         — platform-agnostic LLM transport
"""

from luxor9.core.agent_registry import AgentRegistry
from luxor9.core.orchestrator import Orchestrator
from luxor9.core.state_manager import StateManager
from luxor9.core.task_queue import TaskQueue
from luxor9.mcp.registry import McpRouter, ModelRegistry

__version__ = "0.1.0"

__all__ = [
    "Orchestrator",
    "AgentRegistry",
    "TaskQueue",
    "StateManager",
    "McpRouter",
    "ModelRegistry",
    "__version__",
]
