"""Require authentication on AG-UI agent endpoints outside open status probes.

Uses pure ASGI middleware (not BaseHTTPMiddleware) so streaming AG-UI
responses are not buffered or re-piped through Starlette's anyio memory
streams.
"""

from __future__ import annotations

from fastapi import HTTPException
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.auth import get_principal
from app.database import SessionLocal


def _header(scope: Scope, name: str) -> str | None:
    target = name.lower().encode("latin-1")
    for key, value in scope.get("headers", []):
        if key == target:
            return value.decode("latin-1")
    return None


def _is_public_agui_path(path: str, method: str) -> bool:
    if method == "OPTIONS":
        return True
    normalized = path.rstrip("/")
    return normalized == "/api/v1/agui/status"


class AguiAuthMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        method = scope.get("method", "GET")
        if not path.startswith("/api/v1/agui/") or _is_public_agui_path(path, method):
            await self.app(scope, receive, send)
            return

        authorization = _header(scope, "authorization")
        demo_user = _header(scope, "x-demo-user")
        async with SessionLocal() as db:
            try:
                await get_principal(
                    authorization=authorization,
                    x_demo_user=demo_user,
                    db=db,
                )
            except HTTPException as exc:
                response = JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
                await response(scope, receive, send)
                return

        # Pass the live ASGI stream through unchanged after auth succeeds.
        await self.app(scope, receive, send)
