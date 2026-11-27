"""AG-UI auth middleware must not wrap streams via BaseHTTPMiddleware."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient
from starlette.applications import Starlette
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
from starlette.routing import Route

from app.middleware.agui_auth import AguiAuthMiddleware


def test_agui_auth_is_pure_asgi_not_base_http_middleware():
    assert not issubclass(AguiAuthMiddleware, BaseHTTPMiddleware)
    assert hasattr(AguiAuthMiddleware, "__call__")
    assert not hasattr(AguiAuthMiddleware, "dispatch")


@pytest.mark.asyncio
async def test_agui_auth_passes_streaming_response_body(monkeypatch):
    """Auth succeeds, then StreamingResponse body is forwarded intact."""
    from app.middleware import agui_auth as mw

    class _Principal:
        pass

    async def _fake_principal(**_kwargs):
        return _Principal()

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
            json={},
        ) as res:
            assert res.status_code == 200
            body = "".join([piece async for piece in res.aiter_text()])
            assert body == "chunk-a|chunk-b|chunk-c"