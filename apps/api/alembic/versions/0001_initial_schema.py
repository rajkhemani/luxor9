"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-11-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # create_all via metadata for SQLite/Postgres parity in MVP; explicit ops kept minimal.
    # Production should expand this into full autogenerate output after first Postgres run.
    bind = op.get_bind()
    from app.database import Base
    from app.models import entities  # noqa: F401

    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    from app.database import Base
    from app.models import entities  # noqa: F401

    Base.metadata.drop_all(bind=bind)
