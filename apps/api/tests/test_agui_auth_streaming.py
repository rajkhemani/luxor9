"""AG-UI auth middleware must not wrap streams via BaseHTTPMiddleware."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient
from starlette.applications import Starlette
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import ClientDisconnect, Request
from starlette.responses import JSONResponse, StreamingResponse
from starlette.routing import Route

from app.auth import Principal
from app.middleware.agui_auth import (
    AguiAuthMiddleware,
    _read_body,
    _receive_with_body,
    scoped_thread_id,
)
from app.models.entities import RoleName


def _principal(*, tenant_id: str = "tenant-a", user_id: str = "user-a") -> Principal:
    return Principal(
        user_id=user_id,
        clerk_user_id=f"clerk_{user_id}",
        email=f"{user_id}@test",
        display_name=user_id,
        tenant_id=tenant_id,
        tenant_name="Tenant",
        role=RoleName.member,
    )


def test_agui_auth_is_pure_asgi_not_base_http_middleware():
    assert not issubclass(AguiAuthMiddleware, BaseHTTPMiddleware)
    assert hasattr(AguiAuthMiddleware, "__call__")
    assert not hasattr(AguiAuthMiddleware, "dispatch")


def test_scoped_thread_id_binds_and_strips_spoofed_prefix():
    p = _principal(tenant_id="t1", user_id="u1")
    assert scoped_thread_id(p, "client-thread") == "t1:u1:client-thread"
    assert scoped_thread_id(p, "evil-tenant:evil-user:client-thread") == "t1:u1:client-thread"


@pytest.mark.asyncio
async def test_agui_auth_passes_streaming_response_body(monkeypatch):
    """Auth succeeds, then StreamingResponse body is forwarded intact."""
    from app.middleware import agui_auth as mw

    async def _fake_principal(**_kwargs):
        return _principal()

    monkeypatch.setattr(mw, "get_principal", _fake_principal)

    async def stream_endpoint(_request):
        async def gen():
            for part in ("chunk-a|", "chunk-b|", "chunk-c"):
                yield part.encode()

        return StreamingResponse(gen(), media_type="text/plain")

    inner = Starlette(routes=[Route("/api/v1/agui/cmo", stream_endpoint, methods=["POST"])])
    app = AguiAuthMiddleware(inner)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        async with client.stream(
            "POST",
            "/api/v1/agui/cmo",
            headers={"Authorization": "Bearer test"},
            json={"threadId": "t1"},
        ) as res:
            assert res.status_code == 200
            body = "".join([piece async for piece in res.aiter_text()])
            assert body == "chunk-a|chunk-b|chunk-c"


@pytest.mark.asyncio
async def test_agui_auth_namespaces_thread_id_per_principal(monkeypatch):
    from app.middleware import agui_auth as mw

    seen: list[str] = []

    async def _fake_principal(**_kwargs):
        return _principal(tenant_id="tenant-x", user_id="user-x")

    monkeypatch.setattr(mw, "get_principal", _fake_principal)

    async def echo_endpoint(request: Request):
        payload = await request.json()
        seen.append(payload["threadId"])
        return JSONResponse(payload)

    inner = Starlette(routes=[Route("/api/v1/agui/cmo", echo_endpoint, methods=["POST"])])
    app = AguiAuthMiddleware(inner)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/agui/cmo",
            headers={"Authorization": "Bearer test"},
            json={"threadId": "shared-client-thread", "messages": []},
        )
        assert res.status_code == 200
        assert res.json()["threadId"] == "tenant-x:user-x:shared-client-thread"
        assert seen == ["tenant-x:user-x:shared-client-thread"]


@pytest.mark.asyncio
async def test_agui_auth_isolates_same_client_thread_across_principals(monkeypatch):
    from app.middleware import agui_auth as mw

    async def echo_endpoint(request: Request):
        return JSONResponse(await request.json())

    inner = Starlette(routes=[Route("/api/v1/agui/cmo", echo_endpoint, methods=["POST"])])
    app = AguiAuthMiddleware(inner)
    transport = ASGITransport(app=app)

    async def principal_a(**_kwargs):
        return _principal(tenant_id="tenant-a", user_id="user-a")

    async def principal_b(**_kwargs):
        return _principal(tenant_id="tenant-b", user_id="user-b")

    monkeypatch.setattr(mw, "get_principal", principal_a)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        a = await client.post(
            "/api/v1/agui/cmo",
            headers={"Authorization": "Bearer a"},
            json={"threadId": "same"},
        )
    monkeypatch.setattr(mw, "get_principal", principal_b)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        b = await client.post(
            "/api/v1/agui/cmo",
            headers={"Authorization": "Bearer b"},
            json={"threadId": "same"},
        )
    assert a.json()["threadId"] == "tenant-a:user-a:same"
    assert b.json()["threadId"] == "tenant-b:user-b:same"
    assert a.json()["threadId"] != b.json()["threadId"]


@pytest.mark.asyncio
async def test_read_body_raises_on_disconnect_instead_of_spinning():
    async def disconnecting_receive():
        return {"type": "http.disconnect"}

    with pytest.raises(ClientDisconnect):
        await _read_body(disconnecting_receive)


@pytest.mark.asyncio
async def test_receive_with_body_forwards_original_receive_after_body():
    calls = {"n": 0}

    async def original_receive():
        calls["n"] += 1
        return {"type": "http.disconnect"}

    receive = _receive_with_body(b'{"threadId":"x"}', original_receive)
    first = await receive()
    assert first == {"type": "http.request", "body": b'{"threadId":"x"}', "more_body": False}
    second = await receive()
    assert second == {"type": "http.disconnect"}
    assert calls["n"] == 1
