"""Initial schema v2 - UUIDs, integrity constraints, and auction hardening.

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-12-23
"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Users
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('role', sa.String(20), server_default='player', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
        sa.CheckConstraint("role IN ('admin', 'team_manager', 'player')", name='ck_user_role')
    )

    # 2. Registration Tokens
    op.create_table(
        'registration_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('token', sa.String(255), nullable=False),
        sa.Column('created_by_user_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('used_by_user_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_used', sa.Boolean(), server_default='false', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token'),
        sa.UniqueConstraint('used_by_user_id')
    )

    # 3. Refresh Tokens
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('token', sa.String(500), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean(), server_default='false', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )

    # 4. Tournaments
    op.create_table(
        'tournaments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('status', sa.String(20), server_default='planning', nullable=False),
        sa.Column('scheduled_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('num_teams', sa.Integer(), nullable=False),
        sa.Column('num_players_per_team', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.CheckConstraint("status IN ('planning', 'registration', 'auction', 'matches', 'completed', 'cancelled')", name='ck_tournament_status')
    )

    # 5. Teams
    op.create_table(
        'teams',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('manager_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('budget_spent', sa.BigInteger(), server_default='0', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 6. Players
    op.create_table(
        'players',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('base_price', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.UUID(), sa.ForeignKey('teams.id'), nullable=True),
        sa.Column('status', sa.String(20), server_default='available', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.CheckConstraint("role IN ('batsman', 'bowler', 'all_rounder', 'wicket_keeper')", name='ck_player_role'),
        sa.CheckConstraint("status IN ('available', 'sold', 'unsold')", name='ck_player_status')
    )

    # 7. Auctions
    op.create_table(
        'auctions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('status', sa.String(20), server_default='scheduled', nullable=False),
        sa.Column('current_player_id', sa.UUID(), sa.ForeignKey('players.id'), nullable=True),
        sa.Column('current_bid', sa.Integer(), nullable=True),
        sa.Column('current_bidder_id', sa.UUID(), sa.ForeignKey('teams.id'), nullable=True),
        sa.Column('min_bid_increment', sa.Integer(), server_default='100', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("status IN ('scheduled', 'ongoing', 'paused', 'completed')", name='ck_auction_status')
    )

    # 8. Bids
    op.create_table(
        'bids',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('auction_id', sa.UUID(), sa.ForeignKey('auctions.id'), nullable=False),
        sa.Column('player_id', sa.UUID(), sa.ForeignKey('players.id'), nullable=False),
        sa.Column('team_id', sa.UUID(), sa.ForeignKey('teams.id'), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('is_winning', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('bid_timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 9. Matches
    op.create_table(
        'matches',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('match_type', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), server_default='scheduled', nullable=False),
        sa.Column('team_1_id', sa.UUID(), sa.ForeignKey('teams.id'), nullable=False),
        sa.Column('team_2_id', sa.UUID(), sa.ForeignKey('teams.id'), nullable=False),
        sa.Column('winner_team_id', sa.UUID(), sa.ForeignKey('teams.id'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("match_type IN ('t20', 'odi', 'test')", name='ck_match_type'),
        sa.CheckConstraint("status IN ('scheduled', 'ongoing', 'completed', 'cancelled')", name='ck_match_status')
    )

    # 10. Player Match Stats
    op.create_table(
        'player_match_stats',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('player_id', sa.UUID(), sa.ForeignKey('players.id'), nullable=False),
        sa.Column('match_id', sa.UUID(), sa.ForeignKey('matches.id'), nullable=False),
        sa.Column('runs_scored', sa.Integer(), server_default='0'),
        sa.Column('wickets_taken', sa.Integer(), server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('player_id', 'match_id', name='uq_player_match')
    )

    # 11. Player Career Stats
    op.create_table(
        'player_career_stats',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('player_id', sa.UUID(), sa.ForeignKey('players.id'), nullable=False),
        sa.Column('total_matches', sa.Integer(), server_default='0'),
        sa.Column('total_runs', sa.BigInteger(), server_default='0'),
        sa.Column('total_wickets', sa.Integer(), server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('player_id')
    )

    # 12. Match Events
    op.create_table(
        'match_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('match_id', sa.UUID(), sa.ForeignKey('matches.id'), nullable=False),
        sa.Column('event_type', sa.String(30), nullable=False),
        sa.Column('sequence_number', sa.Integer(), nullable=False),
        sa.Column('event_data', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('match_id', 'sequence_number', name='uq_match_sequence'),
        sa.CheckConstraint("event_type IN ('match_started', 'innings_started', 'run_scored', 'wicket', 'over_completed', 'innings_ended', 'match_ended')", name='ck_event_type')
    )

    # 13. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.UUID(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("action IN ('create', 'update', 'delete', 'login', 'logout', 'bid_placed', 'player_sold', 'match_started', 'match_ended')", name='ck_audit_action')
    )

def downgrade() -> None:
    tables = [
        'audit_logs', 'match_events', 'player_career_stats', 'player_match_stats',
        'matches', 'bids', 'auctions', 'players', 'teams', 'tournaments',
        'refresh_tokens', 'registration_tokens', 'users'
    ]
    for table in tables:
        op.drop_table(table)