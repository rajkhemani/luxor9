from __future__ import annotations

import hashlib
from datetime import datetime, timezone


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


async def fetch_public_sources(objective: str, topic: str) -> list[dict]:
    """Deterministic synthetic public sources for MVP (no live scrape in CI)."""
    now = datetime.now(timezone.utc).isoformat()
    samples = [
        {
            "title": f"Dubai {topic} outlook — public brief",
            "canonical_uri": f"https://example.com/dubai/{topic.replace(' ', '-')}",
            "publisher": "Example Market Desk",
            "excerpt": (
                f"Public research summary for '{objective}' focusing on {topic} "
                f"in Dubai real estate. Collected at {now}."
            ),
        },
        {
            "title": f"Competitor landscape note — {topic}",
            "canonical_uri": f"https://example.org/research/{topic.replace(' ', '-')}",
            "publisher": "Example Research",
            "excerpt": (
                f"Positioning signals related to {topic} for developer launches "
                f"aligned to: {objective[:120]}"
            ),
        },
    ]
    out = []
    for s in samples:
        body = s["excerpt"]
        out.append(
            {
                **s,
                "source_type": "public_web",
                "content_hash": _hash(body),
                "collected_at": now,
            }
        )
    return out
