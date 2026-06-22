"""Enumerations shared across the orchestrator, agents, and MCP layers."""

from __future__ import annotations

from enum import Enum


class AgentType(str, Enum):
    """The 12 specialized LUXOR9 agents."""

    OVERSEER = "OVERSEER"  # Executive orchestration
    HR_MANAGER = "HR_MANAGER"  # Talent / tool discovery
    INTEGRATION_LEAD = "INTEGRATION_LEAD"  # API integration
    RESEARCHER = "RESEARCHER"  # Web intelligence
    DATA_ANALYST = "DATA_ANALYST"  # Data aggregation
    DEVELOPER = "DEVELOPER"  # Code execution
    VISIONARY = "VISIONARY"  # Image generation / analysis
    DIRECTOR = "DIRECTOR"  # Video generation
    COMMUNICATOR = "COMMUNICATOR"  # API / TTS / transcription
    NAVIGATOR = "NAVIGATOR"  # Geospatial
    SPEEDSTER = "SPEEDSTER"  # Lightweight inference
    ANTIGRAVITY = "ANTIGRAVITY"  # Infrastructure / DevOps


class AgentStatus(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    PAUSED = "paused"
    ERROR = "error"


class TaskStatus(str, Enum):
    PENDING = "pending"  # submitted; dependencies not yet satisfied
    READY = "ready"  # dependencies satisfied; awaiting an executor
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    BLOCKED = "blocked"  # an upstream dependency failed


class Capability(str, Enum):
    ORCHESTRATION = "orchestration"
    TALENT_DISCOVERY = "talent_discovery"
    API_INTEGRATION = "api_integration"
    WEB_RESEARCH = "web_research"
    DATA_ANALYSIS = "data_analysis"
    CODE_EXECUTION = "code_execution"
    IMAGE_GENERATION = "image_generation"
    VIDEO_GENERATION = "video_generation"
    COMMUNICATION = "communication"
    GEOSPATIAL = "geospatial"
    FAST_INFERENCE = "fast_inference"
    INFRASTRUCTURE = "infrastructure"


class McpPlatform(str, Enum):
    MOCK = "mock"
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"
    GROQ = "groq"
    DEEPSEEK = "deepseek"
    XAI = "xai"
    HUGGINGFACE = "huggingface"
    REPLICATE = "replicate"
    OPENROUTER = "openrouter"
    CUSTOM = "custom"


class EventType(str, Enum):
    TASK_SUBMITTED = "task.submitted"
    TASK_READY = "task.ready"
    TASK_STARTED = "task.started"
    TASK_COMPLETED = "task.completed"
    TASK_FAILED = "task.failed"
    TASK_CANCELLED = "task.cancelled"
    AGENT_REGISTERED = "agent.registered"
    AGENT_STATUS_CHANGED = "agent.status_changed"
    WORKFLOW_STARTED = "workflow.started"
    WORKFLOW_COMPLETED = "workflow.completed"
