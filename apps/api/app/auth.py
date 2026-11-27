from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models.entities import Membership, RoleName, Tenant, User
from app.security.clerk_jwt import ClerkTokenError, verify_clerk_token

# Exact Clerk role identifiers only — never substring match custom roles.
_CLERK_ROLE_MAP = {
    "org:admin": RoleName.admin,
    "admin": RoleName.admin,
    "org:approver": RoleName.approver,
    "approver": RoleName.approver,
    "org:member": RoleName.member,
    "member": RoleName.member,
}


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
    """Demo auth is never allowed in production, even if AUTH_DISABLED_FOR_TESTS is set."""
    settings = get_settings()
    if settings.environment == "production":
        return False
    return settings.auth_disabled_for_tests or settings.environment == "development"


def _role_from_org_claim(org_role: str | None) -> RoleName:
    if not org_role:
        return RoleName.member
    return _CLERK_ROLE_MAP.get(org_role.lower(), RoleName.member)


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


async def _get_or_create_tenant(
    db: AsyncSession,
    *,
    slug: str,
    name: str,
    clerk_org_id: str | None,
) -> Tenant:
    if clerk_org_id:
        result = await db.execute(select(Tenant).where(Tenant.clerk_org_id == clerk_org_id))
        tenant = result.scalar_one_or_none()
        if tenant is not None:
            return tenant
    else:
        result = await db.execute(select(Tenant).where(Tenant.slug == slug))
        tenant = result.scalar_one_or_none()
        if tenant is not None:
            return tenant

    # Contested insert must live inside the savepoint; begin_nested() auto-flushes
    # pending state first, so adding before the nested block can poison the outer txn.
    try:
        async with db.begin_nested():
            tenant = Tenant(name=name[:255], slug=slug[:100], clerk_org_id=clerk_org_id)
            db.add(tenant)
            await db.flush()
    except IntegrityError:
        if clerk_org_id:
            result = await db.execute(select(Tenant).where(Tenant.clerk_org_id == clerk_org_id))
        else:
            result = await db.execute(select(Tenant).where(Tenant.slug == slug))
        tenant = result.scalar_one()
    return tenant


async def _try_claim_seed_demo_tenant(db: AsyncSession, org_id: str) -> Tenant | None:
    """Atomically link luxor9-re-demo to org_id only while still unlinked.

    Two orgs racing must not both receive the seed tenant: the UPDATE predicate
    ensures a single winner; losers return None and provision their own tenant.
    """
    result = await db.execute(
        update(Tenant)
        .where(Tenant.slug == "luxor9-re-demo", Tenant.clerk_org_id.is_(None))
        .values(clerk_org_id=org_id)
        .returning(Tenant.id)
    )
    claimed_id = result.scalar_one_or_none()
    if claimed_id is None:
        return None
    await db.flush()
    loaded = await db.execute(select(Tenant).where(Tenant.id == claimed_id))
    return loaded.scalar_one()


async def _resolve_tenant_for_claims(
    db: AsyncSession, claims: dict, clerk_user_id: str
) -> tuple[Tenant, RoleName]:
    org_id = claims.get("org_id")
    role = _role_from_org_claim(claims.get("org_role"))

    if org_id:
        org_id_str = str(org_id)
        existing = await db.execute(select(Tenant).where(Tenant.clerk_org_id == org_id_str))
        tenant = existing.scalar_one_or_none()
        if tenant is not None:
            return tenant, role

        # One-time association: first Clerk org to claim the unlinked seed demo wins.
        claimed = await _try_claim_seed_demo_tenant(db, org_id_str)
        if claimed is not None:
            return claimed, role

        # Another org may have just claimed the seed, or our org_id may have linked
        # via a concurrent request — re-check before creating a new tenant.
        existing = await db.execute(select(Tenant).where(Tenant.clerk_org_id == org_id_str))
        tenant = existing.scalar_one_or_none()
        if tenant is not None:
            return tenant, role

        org_slug = claims.get("org_slug") or f"org-{org_id_str}"
        org_name = str(claims.get("org_name") or org_slug)
        slug = f"{_slugify(str(org_slug))}-{org_id_str[-8:]}"
        tenant = await _get_or_create_tenant(
            db, slug=slug, name=org_name, clerk_org_id=org_id_str
        )
        return tenant, role

    # No active Clerk org — isolate each verified human in a personal tenant.
    personal_slug = f"user-{_slugify(clerk_user_id)}"[:100]
    tenant = await _get_or_create_tenant(
        db,
        slug=personal_slug,
        name=f"Personal · {clerk_user_id}"[:255],
        clerk_org_id=None,
    )
    return tenant, RoleName.member


async def _principal_from_claims(db: AsyncSession, claims: dict) -> Principal:
    clerk_user_id = str(claims["sub"])
    claim_email = claims.get("email")
    claim_name = claims.get("name") or claims.get("email")

    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()
    if user is None:
        email = str(claim_email or f"{clerk_user_id}@users.clerk.local")
        display_name = str(claim_name or clerk_user_id)
        try:
            async with db.begin_nested():
                user = User(
                    clerk_user_id=clerk_user_id, email=email, display_name=display_name
                )
                db.add(user)
                await db.flush()
        except IntegrityError:
            result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
            user = result.scalar_one()
    else:
        # Preserve stored profile when optional claims are absent.
        if claim_email:
            user.email = str(claim_email)
        if claim_name:
            user.display_name = str(claim_name)

    tenant, role_from_claim = await _resolve_tenant_for_claims(db, claims, clerk_user_id)

    membership_result = await db.execute(
        select(Membership).where(
            Membership.tenant_id == tenant.id,
            Membership.user_id == user.id,
        )
    )
    membership = membership_result.scalar_one_or_none()
    if membership is None:
        try:
            async with db.begin_nested():
                membership = Membership(
                    tenant_id=tenant.id, user_id=user.id, role=role_from_claim
                )
                db.add(membership)
                await db.flush()
        except IntegrityError:
            membership_result = await db.execute(
                select(Membership).where(
                    Membership.tenant_id == tenant.id,
                    Membership.user_id == user.id,
                )
            )
            membership = membership_result.scalar_one()
    elif claims.get("org_id") is not None:
        # Verified org session: align membership to the current exact org_role claim
        # so Clerk demotions/promotions take effect on the next token. Phase C webhooks
        # still needed for near-real-time revoke before JWT expiry.
        membership.role = role_from_claim

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

    # Production: demo headers are always rejected (test flag cannot override).
    if settings.environment == "production" and x_demo_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Demo auth is disabled in production",
        )
    if settings.environment == "production" and settings.auth_disabled_for_tests:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AUTH_DISABLED_FOR_TESTS cannot be enabled in production",
        )

    if x_demo_user and not _demo_auth_allowed():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Demo auth is disabled outside development/tests",
        )

    # Explicit demo / test path only when development or AUTH_DISABLED_FOR_TESTS (non-prod).
    if _demo_auth_allowed() and (x_demo_user or settings.auth_disabled_for_tests):
        if not (authorization and authorization.lower().startswith("bearer ")):
            demo_id = x_demo_user or "user_demo_admin"
            return await _ensure_demo_principal(db, demo_id, f"{demo_id}@luxor9.local")

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
