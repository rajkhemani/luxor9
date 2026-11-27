from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models.entities import Membership, RoleName, Tenant, User
from app.security.clerk_jwt import ClerkTokenError, verify_clerk_token


@dataclass
class Principal:
    user_id: str
    clerk_user_id: str
    email: str
    display_name: str
    tenant_id: str
    tenant_name: str
    role: RoleName
    clerk_org_id: str | None = None


def _demo_auth_allowed() -> bool:
    settings = get_settings()
    return settings.auth_disabled_for_tests or settings.environment == "development"


def _role_from_org_claim(org_role: str | None) -> RoleName:
    if not org_role:
        return RoleName.member
    normalized = org_role.lower()
    if "admin" in normalized:
        return RoleName.admin
    if "approver" in normalized:
        return RoleName.approver
    return RoleName.member


def _slugify(value: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return (cleaned or "tenant")[:90]


async def _ensure_demo_principal(db: AsyncSession, clerk_user_id: str, email: str) -> Principal:
    if not _demo_auth_allowed():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Demo auth is disabled outside development/tests",
        )

    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()
    if user is None:
        tenant_result = await db.execute(select(Tenant).where(Tenant.slug == "luxor9-re-demo"))
        tenant = tenant_result.scalar_one_or_none()
        if tenant is None:
            tenant = Tenant(name="Luxor9 Real-Estate Developers", slug="luxor9-re-demo")
            db.add(tenant)
            await db.flush()
        role = RoleName.admin if "admin" in clerk_user_id else RoleName.member
        if "approver" in clerk_user_id:
            role = RoleName.approver
        user = User(clerk_user_id=clerk_user_id, email=email, display_name=clerk_user_id)
        db.add(user)
        await db.flush()
        membership = Membership(tenant_id=tenant.id, user_id=user.id, role=role)
        db.add(membership)
        await db.commit()
        return Principal(
            user_id=user.id,
            clerk_user_id=user.clerk_user_id,
            email=user.email,
            display_name=user.display_name,
            tenant_id=tenant.id,
            tenant_name=tenant.name,
            role=role,
        )

    result = await db.execute(
        select(Membership)
        .where(Membership.user_id == user.id)
        .options(selectinload(Membership.tenant))
        .limit(1)
    )
    membership = result.scalar_one()
    return Principal(
        user_id=user.id,
        clerk_user_id=user.clerk_user_id,
        email=user.email,
        display_name=user.display_name,
        tenant_id=membership.tenant_id,
        tenant_name=membership.tenant.name,
        role=membership.role,
        clerk_org_id=membership.tenant.clerk_org_id,
    )


async def _resolve_tenant_for_claims(db: AsyncSession, claims: dict) -> tuple[Tenant, RoleName]:
    org_id = claims.get("org_id")
    org_slug = claims.get("org_slug") or (f"org-{org_id}" if org_id else "luxor9-personal")
    org_name = claims.get("org_name") or org_slug
    role = _role_from_org_claim(claims.get("org_role"))

    if org_id:
        result = await db.execute(select(Tenant).where(Tenant.clerk_org_id == org_id))
        tenant = result.scalar_one_or_none()
        if tenant is None:
            slug = _slugify(str(org_slug))
            # Avoid unique collisions across orgs.
            slug = f"{slug}-{org_id[-8:]}" if org_id else slug
            tenant = Tenant(name=str(org_name)[:255], slug=slug[:100], clerk_org_id=org_id)
            db.add(tenant)
            await db.flush()
        return tenant, role

    # No active Clerk org — personal/default demo tenant for verified human.
    result = await db.execute(select(Tenant).where(Tenant.slug == "luxor9-re-demo"))
    tenant = result.scalar_one_or_none()
    if tenant is None:
        tenant = Tenant(name="Luxor9 Real-Estate Developers", slug="luxor9-re-demo")
        db.add(tenant)
        await db.flush()
    return tenant, RoleName.admin if "admin" in str(claims.get("sub", "")) else RoleName.member


async def _principal_from_claims(db: AsyncSession, claims: dict) -> Principal:
    clerk_user_id = str(claims["sub"])
    email = str(claims.get("email") or f"{clerk_user_id}@users.clerk.local")
    display_name = str(claims.get("name") or claims.get("email") or clerk_user_id)

    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(clerk_user_id=clerk_user_id, email=email, display_name=display_name)
        db.add(user)
        await db.flush()
    else:
        user.email = email
        user.display_name = display_name

    tenant, role = await _resolve_tenant_for_claims(db, claims)

    membership_result = await db.execute(
        select(Membership).where(
            Membership.tenant_id == tenant.id,
            Membership.user_id == user.id,
        )
    )
    membership = membership_result.scalar_one_or_none()
    if membership is None:
        membership = Membership(tenant_id=tenant.id, user_id=user.id, role=role)
        db.add(membership)
    else:
        # Keep membership role in sync with Clerk org role when present.
        if claims.get("org_role"):
            membership.role = role

    await db.commit()
    return Principal(
        user_id=user.id,
        clerk_user_id=user.clerk_user_id,
        email=user.email,
        display_name=user.display_name,
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        role=membership.role,
        clerk_org_id=tenant.clerk_org_id,
    )


async def get_principal(
    authorization: str | None = Header(default=None),
    x_demo_user: str | None = Header(default=None, alias="X-Demo-User"),
    db: AsyncSession = Depends(get_db),
) -> Principal:
    settings = get_settings()

    # Production fail-closed: demo headers never authenticate.
    if x_demo_user and not _demo_auth_allowed():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Demo auth is disabled outside development/tests",
        )

    # Explicit demo / test path only when development or AUTH_DISABLED_FOR_TESTS.
    if _demo_auth_allowed() and (x_demo_user or settings.auth_disabled_for_tests):
        # Prefer Bearer when both present in development so JWKS path stays testable.
        if not (authorization and authorization.lower().startswith("bearer ")):
            demo_id = x_demo_user or "user_demo_admin"
            return await _ensure_demo_principal(db, demo_id, f"{demo_id}@luxor9.local")

    # Development convenience: no Authorization and no demo header → demo admin.
    if _demo_auth_allowed() and not authorization:
        return await _ensure_demo_principal(db, "user_demo_admin", "user_demo_admin@luxor9.local")

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    try:
        claims = await verify_clerk_token(token, settings)
    except ClerkTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    return await _principal_from_claims(db, claims)


def require_roles(*roles: RoleName):
    allowed = set(roles)

    async def _checker(principal: Principal = Depends(get_principal)) -> Principal:
        if principal.role == RoleName.admin:
            return principal
        if principal.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return principal

    return _checker
