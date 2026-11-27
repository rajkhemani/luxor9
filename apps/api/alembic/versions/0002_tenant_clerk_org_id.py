"""Add tenants.clerk_org_id for Clerk organization mapping.

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("clerk_org_id", sa.String(length=255), nullable=True))
    op.create_index("ix_tenants_clerk_org_id", "tenants", ["clerk_org_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_tenants_clerk_org_id", table_name="tenants")
    op.drop_column("tenants", "clerk_org_id")
