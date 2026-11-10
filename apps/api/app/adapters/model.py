from __future__ import annotations


async def complete_json(prompt: str, schema_hint: str = "") -> dict:
    """Stub model adapter — deterministic blueprint/report content for offline tests."""
    _ = schema_hint
    return {
        "provider": "stub",
        "prompt_preview": prompt[:200],
        "content": {
            "notes": "Stub model output — replace with live provider behind this adapter."
        },
    }
