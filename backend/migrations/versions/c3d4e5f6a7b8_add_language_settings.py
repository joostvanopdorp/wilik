"""Add default_language and public_language_button_enabled to AppSettings

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-11-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("app_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "default_language",
                sa.String(length=10),
                nullable=False,
                server_default="system",
            )
        )
        batch_op.add_column(
            sa.Column(
                "public_language_button_enabled",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )


def downgrade():
    with op.batch_alter_table("app_settings", schema=None) as batch_op:
        batch_op.drop_column("public_language_button_enabled")
        batch_op.drop_column("default_language")
