"""Require authentication on AG-UI agent endpoints outside open status probes."""

from __future__ import annotations

from fastapi import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.auth import get_principal
from app.database import SessionLocal


class AguiAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if not path.startswith("/api/v1/agui/"):
            return await call_next(request)
        if path.rstrip("/").endswith("/agui/status") or path.endswith("/status"):
            # Public readiness probe for connectivity checks.
            if "agui/status" in path:
                return await call_next(request)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Status endpoint is public; agent run endpoints require a principal.
        if path.rstrip("/") == "/api/v1/agui/status":
            return await call_next(request)

        authorization = request.headers.get("authorization")
        demo_user = request.headers.get("x-demo-user")
        async with SessionLocal() as db:
            try:
                await get_principal(
                    authorization=authorization,
                    x_demo_user=demo_user,
                    db=db,
                )
            except HTTPException as exc:
                return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)

        return await call_next(request)
