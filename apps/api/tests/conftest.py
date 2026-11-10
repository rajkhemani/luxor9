import os

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

os.environ["AUTH_DISABLED_FOR_TESTS"] = "true"
os.environ["ENVIRONMENT"] = "development"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["DATABASE_URL_SYNC"] = "sqlite:///:memory:"

from app.config import get_settings

get_settings.cache_clear()

from app.database import Base, get_db
from app.main import create_app
from app.models import entities  # noqa: F401


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_engine):
    Session = async_sessionmaker(db_engine, expire_on_commit=False)

    async def _override_db():
        async with Session() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = _override_db
    # Avoid lifespan create_all against default engine
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
