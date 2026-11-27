"""Require authentication on AG-UI agent endpoints outside open status probes.

Uses pure ASGI middleware (not BaseHTTPMiddleware) so streaming AG-UI
responses are not buffered or re-piped through Starlette's anyio memory
streams.

After auth, request bodies are rewritten so ``threadId`` / ``thread_id`` are
namespaced to the verified tenant+user. That binds MemorySaver checkpoints
to the authenticated principal (L9-011 interim until Postgres checkpointer).
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from fastapi import HTTPException
from starlette.requests import ClientDisconnect
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.auth import Principal, get_principal
from app.database import SessionLocal

_SCOPE_SEP = ":"


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


def scoped_thread_id(principal: Principal, raw: str | None) -> str:
    """Bind a client thread id to tenant+user; ignore any client-supplied scope prefix."""
    client = (raw or "").strip() or str(uuid.uuid4())
    parts = client.split(_SCOPE_SEP, 2)
    if len(parts) == 3 and parts[0] and parts[1]:
        # Drop a prior tenant:user: prefix so callers cannot spoof another scope.
        client = parts[2] or str(uuid.uuid4())
    return f"{principal.tenant_id}{_SCOPE_SEP}{principal.user_id}{_SCOPE_SEP}{client}"


def _rewrite_thread_fields(payload: dict[str, Any], principal: Principal) -> dict[str, Any]:
    out = dict(payload)
    if "threadId" in out or "thread_id" in out:
        raw = out.get("threadId") if out.get("threadId") is not None else out.get("thread_id")
        scoped = scoped_thread_id(principal, None if raw is None else str(raw))
        if "threadId" in out:
            out["threadId"] = scoped
        if "thread_id" in out:
            out["thread_id"] = scoped
    else:
        # Ensure agent runs always land in a principal-scoped checkpoint key.
        out["threadId"] = scoped_thread_id(principal, None)
    return out


def _replace_content_length(scope: Scope, length: int) -> Scope:
    headers = [
        (k, v)
        for k, v in scope.get("headers", [])
        if k.lower() != b"content-length"
    ]
    headers.append((b"content-length", str(length).encode("latin-1")))
    return {**scope, "headers": headers}


async def _read_body(receive: Receive) -> bytes:
    chunks: list[bytes] = []
    while True:
        message = await receive()
        if message["type"] == "http.disconnect":
            # Never spin on disconnect — that freezes the event loop.
            raise ClientDisconnect()
        if message["type"] != "http.request":
            continue
        chunks.append(message.get("body", b""))
        if not message.get("more_body"):
            break
    return b"".join(chunks)


def _receive_with_body(body: bytes, original_receive: Receive) -> Receive:
    """Replay the rewritten body once, then forward real disconnects from the server."""
    sent = False

    async def receive() -> Message:
        nonlocal sent
        if not sent:
            sent = True
            return {"type": "http.request", "body": body, "more_body": False}
        return await original_receive()

    return receive


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
                principal = await get_principal(
                    authorization=authorization,
                    x_demo_user=demo_user,
                    db=db,
                )
            except HTTPException as exc:
                response = JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
                await response(scope, receive, send)
                return

        if method in {"POST", "PUT", "PATCH"}:
            try:
                raw = await _read_body(receive)
            except ClientDisconnect:
                return
            try:
                parsed = json.loads(raw.decode("utf-8") or "{}")
            except (UnicodeDecodeError, json.JSONDecodeError):
                parsed = None
            if isinstance(parsed, dict):
                rewritten = _rewrite_thread_fields(parsed, principal)
                body = json.dumps(rewritten).encode("utf-8")
                scope = _replace_content_length(scope, len(body))
                receive = _receive_with_body(body, receive)
            else:
                receive = _receive_with_body(raw, receive)

        await self.app(scope, receive, send)
