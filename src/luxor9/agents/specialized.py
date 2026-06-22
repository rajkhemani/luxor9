"""The 12 specialized LUXOR9 agents.

Grouped in one module because each implementation is small and they share a
common shape. Agents that can compute deterministically (DATA_ANALYST,
NAVIGATOR, SPEEDSTER) do so directly; the rest delegate to the MCP router, which
falls back to the deterministic mock adapter when no API key is configured.
"""

from __future__ import annotations

import math
from typing import Any

from luxor9.agents.base import AgentBase, ExecutionContext
from luxor9.shared.enums import AgentType, Capability


class OverseerAgent(AgentBase):
    agent_type = AgentType.OVERSEER
    capabilities = [Capability.ORCHESTRATION]
    description = "Executive orchestration: decomposes goals and coordinates agents."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        plan = await context.complete(
            f"Break down this objective into a short ordered plan:\n{context.task.title}",
            system="You are OVERSEER, the executive orchestrator.",
        )
        return {"agent": self.agent_type.value, "plan": plan}


class HrManagerAgent(AgentBase):
    agent_type = AgentType.HR_MANAGER
    capabilities = [Capability.TALENT_DISCOVERY]
    description = "Discovers the right agents and tools for a job."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        recommendation = await context.complete(
            f"Recommend agents/tools for: {context.task.title}",
            system="You are HR_MANAGER, a talent and tool scout.",
        )
        return {"agent": self.agent_type.value, "recommendation": recommendation}


class IntegrationLeadAgent(AgentBase):
    agent_type = AgentType.INTEGRATION_LEAD
    capabilities = [Capability.API_INTEGRATION]
    description = "Plans and wires third-party API integrations."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        plan = await context.complete(
            f"Outline an API integration plan for: {context.task.title}",
            system="You are INTEGRATION_LEAD.",
        )
        return {"agent": self.agent_type.value, "integration_plan": plan}


class ResearcherAgent(AgentBase):
    agent_type = AgentType.RESEARCHER
    capabilities = [Capability.WEB_RESEARCH]
    description = "Gathers and summarizes web intelligence."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        summary = await context.complete(
            f"Research and summarize key facts about: {context.task.title}",
            system="You are RESEARCHER, a web intelligence analyst.",
        )
        return {"agent": self.agent_type.value, "summary": summary}


class DataAnalystAgent(AgentBase):
    agent_type = AgentType.DATA_ANALYST
    capabilities = [Capability.DATA_ANALYSIS]
    description = "Aggregates and computes statistics over numeric data."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        raw = context.task.input.get("data", [])
        numbers = [float(x) for x in raw if isinstance(x, (int, float))]
        if not numbers:
            return {"agent": self.agent_type.value, "count": 0, "stats": None}
        stats = {
            "count": len(numbers),
            "sum": sum(numbers),
            "mean": sum(numbers) / len(numbers),
            "min": min(numbers),
            "max": max(numbers),
        }
        return {"agent": self.agent_type.value, "count": len(numbers), "stats": stats}


class DeveloperAgent(AgentBase):
    agent_type = AgentType.DEVELOPER
    capabilities = [Capability.CODE_EXECUTION]
    description = "Produces implementation plans and code (no arbitrary execution)."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        plan = await context.complete(
            f"Write an implementation plan for: {context.task.title}",
            system="You are DEVELOPER, a senior engineer.",
        )
        return {"agent": self.agent_type.value, "implementation_plan": plan}


class VisionaryAgent(AgentBase):
    agent_type = AgentType.VISIONARY
    capabilities = [Capability.IMAGE_GENERATION]
    description = "Generates and analyzes imagery."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        brief = await context.complete(
            f"Describe an image concept for: {context.task.title}",
            system="You are VISIONARY, a visual designer.",
        )
        return {"agent": self.agent_type.value, "image_brief": brief}


class DirectorAgent(AgentBase):
    agent_type = AgentType.DIRECTOR
    capabilities = [Capability.VIDEO_GENERATION]
    description = "Generates video storyboards and scene plans."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        storyboard = await context.complete(
            f"Draft a short storyboard for: {context.task.title}",
            system="You are DIRECTOR, a video producer.",
        )
        return {"agent": self.agent_type.value, "storyboard": storyboard}


class CommunicatorAgent(AgentBase):
    agent_type = AgentType.COMMUNICATOR
    capabilities = [Capability.COMMUNICATION]
    description = "Handles messaging, TTS, and transcription."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        message = await context.complete(
            f"Draft a clear message for: {context.task.title}",
            system="You are COMMUNICATOR.",
        )
        return {"agent": self.agent_type.value, "message": message}


class NavigatorAgent(AgentBase):
    agent_type = AgentType.NAVIGATOR
    capabilities = [Capability.GEOSPATIAL]
    description = "Geospatial reasoning and distance computation."

    @staticmethod
    def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        radius = 6371.0  # Earth radius in km
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
        )
        return radius * 2 * math.asin(math.sqrt(a))

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        origin = context.task.input.get("origin")
        destination = context.task.input.get("destination")
        if origin and destination:
            distance = self._haversine_km(origin[0], origin[1], destination[0], destination[1])
            return {
                "agent": self.agent_type.value,
                "distance_km": round(distance, 3),
                "origin": origin,
                "destination": destination,
            }
        return {"agent": self.agent_type.value, "distance_km": None}


class SpeedsterAgent(AgentBase):
    agent_type = AgentType.SPEEDSTER
    capabilities = [Capability.FAST_INFERENCE]
    description = "Lightweight, low-latency transforms."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        text = str(context.task.input.get("text", context.task.title))
        return {
            "agent": self.agent_type.value,
            "echo": text,
            "length": len(text),
            "upper": text.upper(),
        }


class AntigravityAgent(AgentBase):
    agent_type = AgentType.ANTIGRAVITY
    capabilities = [Capability.INFRASTRUCTURE]
    description = "Infrastructure and DevOps automation."

    async def execute(self, context: ExecutionContext) -> dict[str, Any]:
        plan = await context.complete(
            f"Propose an infrastructure/deployment approach for: {context.task.title}",
            system="You are ANTIGRAVITY, an SRE/DevOps engineer.",
        )
        return {"agent": self.agent_type.value, "infra_plan": plan}


ALL_AGENT_CLASSES: list[type[AgentBase]] = [
    OverseerAgent,
    HrManagerAgent,
    IntegrationLeadAgent,
    ResearcherAgent,
    DataAnalystAgent,
    DeveloperAgent,
    VisionaryAgent,
    DirectorAgent,
    CommunicatorAgent,
    NavigatorAgent,
    SpeedsterAgent,
    AntigravityAgent,
]
