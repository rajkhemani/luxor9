"""ASGI entrypoint: ``uvicorn luxor9.api.main:app``."""

from __future__ import annotations

from luxor9.api.app import create_app

app = create_app()
