"""Add tenants.clerk_org_id for Clerk organization mapping.

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-27

Note: revision 0001 uses Base.metadata.create_all, so fresh DBs may already
have clerk_org_id. This revision is idempotent.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("tenants")}
    if "clerk_org_id" not in columns:
        op.add_column("tenants", sa.Column("clerk_org_id", sa.String(length=255), nullable=True))
    indexes = {idx["name"] for idx in inspector.get_indexes("tenants")}
    if "ix_tenants_clerk_org_id" not in indexes:
        op.create_index("ix_tenants_clerk_org_id", "tenants", ["clerk_org_id"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    indexes = {idx["name"] for idx in inspector.get_indexes("tenants")}
    if "ix_tenants_clerk_org_id" in indexes:
        op.drop_index("ix_tenants_clerk_org_id", table_name="tenants")
    columns = {col["name"] for col in inspector.get_columns("tenants")}
    if "clerk_org_id" in columns:
        op.drop_column("tenants", "clerk_org_id")
