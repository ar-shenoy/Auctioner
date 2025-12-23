"""Add auth revision stub for Phase 3.

Revision ID: 002_add_auth
Revises: 001_initial_schema
Create Date: 2025-12-23

This migration is a Phase-3 marker. All required auth-related schema
objects (refresh_tokens) were already added in the previous migration.
The migration is intentionally a no-op for schema changes but provides a
place to add explicit auth-related DB changes later (e.g. token indexes,
constraints) in a separate migration.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_auth'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # No schema changes required at this time; refresh tokens table exists.
    pass


def downgrade() -> None:
    # No downgrade steps required for a no-op migration.
    pass
