from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models.entities import Membership, RoleName, Tenant, User


@dataclass
class Principal:
    user_id: str
    clerk_user_id: str
    email: str
    display_name: str
    tenant_id: str
    tenant_name: str
    role: RoleName


async def _ensure_demo_principal(db: AsyncSession, clerk_user_id: str, email: str) -> Principal:
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
    )


async def get_principal(
    authorization: str | None = Header(default=None),
    x_demo_user: str | None = Header(default=None, alias="X-Demo-User"),
    db: AsyncSession = Depends(get_db),
) -> Principal:
    settings = get_settings()

    if settings.auth_disabled_for_tests or settings.environment == "development":
        if x_demo_user or settings.auth_disabled_for_tests or not authorization:
            demo_id = x_demo_user or "user_demo_admin"
            return await _ensure_demo_principal(db, demo_id, f"{demo_id}@luxor9.local")

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not settings.clerk_jwks_url:
        return await _ensure_demo_principal(db, f"clerk:{token[:16]}", "clerk-user@luxor9.local")

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Configure Clerk JWKS verification or use development demo auth",
    )


def require_roles(*roles: RoleName):
    allowed = set(roles)

    async def _checker(principal: Principal = Depends(get_principal)) -> Principal:
        if principal.role == RoleName.admin:
            return principal
        if principal.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return principal

    return _checker
