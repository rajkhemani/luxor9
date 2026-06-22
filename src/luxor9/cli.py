"""Command-line interface: ``luxor9 [agents|demo|serve]``."""

from __future__ import annotations

import argparse
import asyncio
import json

from luxor9.core.orchestrator import Orchestrator
from luxor9.shared.enums import AgentType
from luxor9.shared.models import Task


def _build() -> Orchestrator:
    orch = Orchestrator()
    orch.bootstrap_default_agents()
    return orch


def cmd_agents() -> None:
    orch = _build()
    for info in orch.registry.directory():
        caps = ", ".join(c.value for c in info.capabilities)
        print(f"{info.type.value:<16} [{info.status.value}]  {caps}")


async def _demo() -> dict:
    orch = _build()
    research = Task(
        title="Survey agent orchestration platforms", assigned_agent=AgentType.RESEARCHER
    )
    analyze = Task(
        title="Aggregate benchmark scores",
        assigned_agent=AgentType.DATA_ANALYST,
        input={"data": [90, 82, 76, 95]},
    )
    report = Task(
        title="Summarize findings",
        assigned_agent=AgentType.OVERSEER,
        dependencies=[research.id, analyze.id],
        is_parallel=False,
    )
    return await orch.orchestrate([research, analyze, report])


def cmd_demo() -> None:
    results = asyncio.run(_demo())
    print(json.dumps(results, indent=2, default=str))


def cmd_serve(host: str, port: int) -> None:
    import uvicorn

    uvicorn.run("luxor9.api.main:app", host=host, port=port, reload=False)


def main() -> None:
    parser = argparse.ArgumentParser(prog="luxor9", description="LUXOR9 orchestration CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("agents", help="List the registered agents")
    sub.add_parser("demo", help="Run a sample multi-agent workflow")
    serve = sub.add_parser("serve", help="Run the FastAPI server")
    serve.add_argument("--host", default="0.0.0.0")
    serve.add_argument("--port", type=int, default=8000)

    args = parser.parse_args()
    if args.command == "agents":
        cmd_agents()
    elif args.command == "demo":
        cmd_demo()
    elif args.command == "serve":
        cmd_serve(args.host, args.port)


if __name__ == "__main__":
    main()
