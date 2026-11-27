"""Clerk JWKS authentication — valid/invalid token contract tests."""

from __future__ import annotations

import time

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import get_settings
from app.database import Base, get_db
from app.main import create_app
from app.models import entities  # noqa: F401
from app.security.clerk_jwt import ClerkTokenError, verify_clerk_token


def _rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


PRIVATE_PEM, PUBLIC_PEM = _rsa_keypair()
KID = "test-key-1"
ISSUER = "https://clerk.test.luxor9.local"
AUDIENCE = "pk_test_luxor9"


def _sign(
    claims: dict,
    *,
    private_pem: bytes = PRIVATE_PEM,
    kid: str = KID,
    algorithm: str = "RS256",
) -> str:
    headers = {"kid": kid} if kid else {}
    return jwt.encode(claims, private_pem, algorithm=algorithm, headers=headers)


def _base_claims(**overrides) -> dict:
    now = int(time.time())
    payload = {
        "sub": "user_clerk_abc",
        "iss": ISSUER,
        "azp": AUDIENCE,
        "iat": now,
        "nbf": now - 5,
        "exp": now + 3600,
        "email": "founder@luxor9.test",
        "name": "Founder Test",
        "org_id": "org_demo_1",
        "org_role": "org:admin",
        "org_slug": "luxor9-re",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def jwks_payload():
    from jose import jwk

    key = jwk.construct(PUBLIC_PEM, algorithm="RS256")
    data = key.to_dict()
    data["kid"] = KID
    data["alg"] = "RS256"
    data["use"] = "sig"
    return {"keys": [data]}


@pytest.fixture
def clerk_settings(monkeypatch, jwks_payload):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("AUTH_DISABLED_FOR_TESTS", "false")
    monkeypatch.setenv("CLERK_JWKS_URL", "https://clerk.test.luxor9.local/.well-known/jwks.json")
    monkeypatch.setenv("CLERK_ISSUER", ISSUER)
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", AUDIENCE)
    monkeypatch.setenv("CLERK_PUBLISHABLE_KEY", AUDIENCE)
    get_settings.cache_clear()

    from app.security import jwks as jwks_mod

    jwks_mod.clear_jwks_cache()

    async def _fake_fetch(_url: str):
        return jwks_payload

    monkeypatch.setattr(jwks_mod, "fetch_jwks", _fake_fetch)
    yield get_settings()
    get_settings.cache_clear()
    jwks_mod.clear_jwks_cache()


@pytest.mark.asyncio
async def test_verify_accepts_valid_token(clerk_settings):
    token = _sign(_base_claims())
    claims = await verify_clerk_token(token, clerk_settings)
    assert claims["sub"] == "user_clerk_abc"
    assert claims["org_id"] == "org_demo_1"


@pytest.mark.asyncio
async def test_verify_rejects_expired_token(clerk_settings):
    token = _sign(_base_claims(exp=int(time.time()) - 10))
    with pytest.raises(ClerkTokenError) as exc:
        await verify_clerk_token(token, clerk_settings)
    assert "expired" in str(exc.value).lower() or "exp" in str(exc.value).lower()


@pytest.mark.asyncio
async def test_verify_rejects_wrong_issuer(clerk_settings):
    token = _sign(_base_claims(iss="https://evil.example"))
    with pytest.raises(ClerkTokenError):
        await verify_clerk_token(token, clerk_settings)


@pytest.mark.asyncio
async def test_verify_rejects_wrong_azp(clerk_settings):
    token = _sign(_base_claims(azp="pk_test_other_app"))
    with pytest.raises(ClerkTokenError):
        await verify_clerk_token(token, clerk_settings)


@pytest.mark.asyncio
async def test_verify_rejects_unsigned_alg_none(clerk_settings):
    import base64
    import json

    def _b64(data: dict) -> str:
        raw = json.dumps(data, separators=(",", ":")).encode()
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

    # Craft an alg=none token manually — python-jose refuses to encode it.
    token = f"{_b64({'alg': 'none', 'typ': 'JWT'})}.{_b64(_base_claims())}."
    with pytest.raises(ClerkTokenError):
        await verify_clerk_token(token, clerk_settings)


@pytest.mark.asyncio
async def test_verify_rejects_unknown_kid(clerk_settings):
    token = _sign(_base_claims(), kid="unknown-kid")
    with pytest.raises(ClerkTokenError):
        await verify_clerk_token(token, clerk_settings)


@pytest.mark.asyncio
async def test_production_missing_jwks_fails_closed(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("AUTH_DISABLED_FOR_TESTS", "false")
    monkeypatch.setenv("CLERK_JWKS_URL", "")
    monkeypatch.setenv("CLERK_ISSUER", "")
    get_settings.cache_clear()
    settings = get_settings()
    with pytest.raises(ClerkTokenError):
        await verify_clerk_token(_sign(_base_claims()), settings)
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_me_accepts_verified_bearer(clerk_settings, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async def _override_db():
        async with Session() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = _override_db
    token = _sign(_base_claims())
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["clerk_user_id"] == "user_clerk_abc"
        assert body["email"] == "founder@luxor9.test"
        assert body["role"] == "admin"
        assert body["tenant_id"]
        # Org-mapped tenant must not be the shared personal fallback.
        me2 = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
        assert me2.json()["tenant_id"] == body["tenant_id"]
        assert me2.json()["role"] == "admin"
    await engine.dispose()


@pytest.mark.asyncio
async def test_production_rejects_demo_header(clerk_settings):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async def _override_db():
        async with Session() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = _override_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/me", headers={"X-Demo-User": "user_demo_admin"})
        assert res.status_code == 401
    await engine.dispose()


@pytest.mark.asyncio
async def test_agui_cmo_requires_auth_in_production(clerk_settings):
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/agui/cmo", json={"threadId": "t1", "messages": []})
        assert res.status_code in {401, 403}


@pytest.mark.asyncio
async def test_second_org_does_not_steal_seed_demo_tenant(clerk_settings, monkeypatch):
    """Atomic claim: first org links luxor9-re-demo; a second org gets its own tenant."""
    from app.models.entities import Tenant

    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as session:
        session.add(Tenant(name="Luxor9 Real-Estate Developers", slug="luxor9-re-demo"))
        await session.commit()

    async def _override_db():
        async with Session() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = _override_db
    token_a = _sign(
        _base_claims(sub="user_org_a", org_id="org_first", org_slug="first", org_role="org:admin")
    )
    token_b = _sign(
        _base_claims(
            sub="user_org_b",
            org_id="org_second",
            org_slug="second",
            org_role="org:admin",
            email="b@test",
        )
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        a = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {token_a}"})
        b = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {token_b}"})
        assert a.status_code == 200 and b.status_code == 200
        assert a.json()["tenant_id"] != b.json()["tenant_id"]
        assert a.json()["tenant_name"] == "Luxor9 Real-Estate Developers"
    await engine.dispose()


@pytest.mark.asyncio
async def test_personal_tenants_are_isolated(clerk_settings, monkeypatch, jwks_payload):
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async def _override_db():
        async with Session() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = _override_db
    token_a = _sign(_base_claims(sub="user_a", org_id=None, org_role=None, org_slug=None))
    token_b = _sign(_base_claims(sub="user_b", org_id=None, org_role=None, org_slug=None, email="b@test"))
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        a = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {token_a}"})
        b = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {token_b}"})
        assert a.status_code == 200 and b.status_code == 200
        assert a.json()["tenant_id"] != b.json()["tenant_id"]
        create = await client.post(
            "/api/v1/workflows",
            json={"objective": "User A private workflow", "context": {}},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert create.status_code == 200
        wf_id = create.json()["id"]
        denied = await client.get(
            f"/api/v1/workflows/{wf_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert denied.status_code == 404
    await engine.dispose()


@pytest.mark.asyncio
async def test_production_rejects_auth_disabled_for_tests(clerk_settings, monkeypatch):
    monkeypatch.setenv("AUTH_DISABLED_FOR_TESTS", "true")
    get_settings.cache_clear()
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/me", headers={"X-Demo-User": "user_demo_admin"})
        assert res.status_code in {401, 503}
    get_settings.cache_clear()
