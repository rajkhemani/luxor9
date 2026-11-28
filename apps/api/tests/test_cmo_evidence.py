from __future__ import annotations

import pytest

from app.executives import cmo


@pytest.mark.asyncio
async def test_synthetic_research_claims_are_never_verified(monkeypatch):
    async def synthetic_sources(_objective: str, _topic: str) -> list[dict]:
        return [
            {
                "title": "Synthetic fixture",
                "canonical_uri": "https://example.com/fixture",
                "publisher": "Example",
                "excerpt": "Synthetic research content for a deterministic test.",
                "source_type": "public_web",
                "content_hash": "fixture-hash",
            }
        ]

    monkeypatch.setattr(cmo.research, "fetch_public_sources", synthetic_sources)

    result = await cmo.run_specialist(
        agent_key="market_researcher",
        objective="Assess market demand",
        context={},
    )

    assert len(result["claims"]) == 1
    claim = result["claims"][0]
    assert claim["status"] == "UNVERIFIED"
    assert claim["confidence"] == 0.0
    assert claim["verification_reason"] == (
        "synthetic_fixture_source_not_independently_verified"
    )
