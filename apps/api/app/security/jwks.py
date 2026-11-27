"""JWKS fetch + cache with key rotation support."""

from __future__ import annotations

import time
from typing import Any

import httpx

_CACHE: dict[str, Any] = {
    "url": None,
    "keys": {},
    "fetched_at": 0.0,
    "last_forced_refresh_at": 0.0,
}
_DEFAULT_TTL_SECONDS = 3600
_MIN_FORCE_REFRESH_SECONDS = 30


class JWKSError(Exception):
    pass


def clear_jwks_cache() -> None:
    _CACHE["url"] = None
    _CACHE["keys"] = {}
    _CACHE["fetched_at"] = 0.0
    _CACHE["last_forced_refresh_at"] = 0.0


async def fetch_jwks(url: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict) or "keys" not in data:
            raise JWKSError("JWKS response missing keys")
        return data


async def get_jwk(url: str, kid: str | None, *, ttl_seconds: int = _DEFAULT_TTL_SECONDS) -> dict[str, Any]:
    now = time.time()
    cache_fresh = (
        _CACHE["url"] == url
        and _CACHE["keys"]
        and (now - float(_CACHE["fetched_at"])) < ttl_seconds
    )

    if not cache_fresh:
        payload = await fetch_jwks(url)
        keys = {item.get("kid"): item for item in payload.get("keys", []) if isinstance(item, dict)}
        _CACHE["url"] = url
        _CACHE["keys"] = keys
        _CACHE["fetched_at"] = now

    keys: dict[str, Any] = _CACHE["keys"]
    if kid and kid in keys:
        return keys[kid]

    if kid:
        # Rotation race: allow one forced refresh, but rate-limit unknown-kid hammering.
        since_force = now - float(_CACHE["last_forced_refresh_at"] or 0.0)
        if since_force >= _MIN_FORCE_REFRESH_SECONDS:
            payload = await fetch_jwks(url)
            keys = {item.get("kid"): item for item in payload.get("keys", []) if isinstance(item, dict)}
            _CACHE["url"] = url
            _CACHE["keys"] = keys
            _CACHE["fetched_at"] = time.time()
            _CACHE["last_forced_refresh_at"] = time.time()
            if kid in keys:
                return keys[kid]
        raise JWKSError(f"Unknown JWKS kid: {kid}")

    if len(keys) == 1:
        return next(iter(keys.values()))
    raise JWKSError("JWT missing kid and JWKS has multiple keys")
