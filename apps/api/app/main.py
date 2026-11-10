from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import (
    agents,
    approvals,
    audit,
    chat,
    evidence,
    health,
    me,
    trust,
    workflows,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="LUXOR9 API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(me.router)
    app.include_router(workflows.router)
    app.include_router(chat.router)
    app.include_router(approvals.router)
    app.include_router(trust.router)
    app.include_router(evidence.router)
    app.include_router(agents.router)
    app.include_router(audit.router)
    return app


app = create_app()
