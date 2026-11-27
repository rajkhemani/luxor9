"""Clerk session JWT verification via JWKS."""

from __future__ import annotations

from typing import Any

from jose import JWTError, jwk, jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError

from app.config import Settings
from app.security.jwks import JWKSError, get_jwk


class ClerkTokenError(Exception):
    pass


_ALLOWED_ALGS = {"RS256"}


def _normalize_org_claims(claims: dict[str, Any]) -> dict[str, Any]:
    """Normalize Clerk org claim shapes onto flat keys used by auth."""
    out = dict(claims)
    if not out.get("org_id"):
        org = claims.get("o")
        if isinstance(org, dict):
            out["org_id"] = org.get("id")
            out["org_slug"] = org.get("slg") or org.get("slug")
            out["org_role"] = org.get("rol") or org.get("role")
    return out


async def verify_clerk_token(token: str, settings: Settings) -> dict[str, Any]:
    if not token or token.count(".") < 2:
        raise ClerkTokenError("Malformed token")

    if settings.environment == "production" and (
        not settings.clerk_jwks_url or not settings.clerk_issuer
    ):
        raise ClerkTokenError("Clerk JWKS/issuer not configured; refusing authentication")

    if not settings.clerk_jwks_url:
        raise ClerkTokenError("Clerk JWKS is not configured; unverified bearer tokens are rejected")

    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise ClerkTokenError("Malformed token header") from exc

    alg = header.get("alg")
    if alg not in _ALLOWED_ALGS:
        raise ClerkTokenError(f"Rejected JWT alg: {alg}")

    kid = header.get("kid")
    try:
        jwk_data = await get_jwk(settings.clerk_jwks_url, kid)
        key = jwk.construct(jwk_data, algorithm="RS256")
    except JWKSError as exc:
        raise ClerkTokenError(str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 — wrap provider/crypto failures
        raise ClerkTokenError("Unable to resolve JWKS signing key") from exc

    options = {
        "verify_aud": False,  # Clerk session tokens use azp; audience optional
        "verify_iss": bool(settings.clerk_issuer),
        "require_exp": True,
        "require_iat": True,
    }
    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer or None,
            options=options,
        )
    except ExpiredSignatureError as exc:
        raise ClerkTokenError("Token expired") from exc
    except JWTClaimsError as exc:
        raise ClerkTokenError(f"Invalid token claims: {exc}") from exc
    except JWTError as exc:
        raise ClerkTokenError("Invalid token signature or format") from exc

    if not claims.get("sub"):
        raise ClerkTokenError("Token missing subject")

    authorized = settings.authorized_party_list
    if authorized:
        azp = claims.get("azp")
        aud = claims.get("aud")
        aud_values = aud if isinstance(aud, list) else ([aud] if aud else [])
        party_ok = (azp in authorized) or any(a in authorized for a in aud_values)
        if not party_ok:
            raise ClerkTokenError("Token authorized party/audience mismatch")

    return _normalize_org_claims(claims)
