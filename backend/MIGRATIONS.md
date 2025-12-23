# Database Migrations Guide

## Overview

This backend uses **Alembic** for database schema management. All migrations are version-controlled and can be applied/reverted in order.

## Schema Design (PHASE 2)

### Core Entities

#### Users

- **Roles**: ADMIN, TEAM_MANAGER, PLAYER
- Authentication via username/email
- Password stored as bcrypt hash (Phase 3)
- Tracks creation and updates

#### RegistrationTokens

- Admin-generated tokens for user registration
- Tokens expire after a configured period
- Each token can only be used once
- Links user who created token and user who used it

#### Teams

- Named teams with managers (TEAM_MANAGER role)
- Track total budget spent during auction
- Players belong to teams

#### Players

- Can be linked to User accounts
- Roles: BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER
- Status: AVAILABLE, SOLD, UNSOLD
- Base price (asking price)
- Sold price after auction

#### Auctions

- Manages the auction of multiple players
- Status: SCHEDULED, ONGOING, PAUSED, COMPLETED
- Tracks current player being auctioned
- Total revenue from auction

#### Bids

- Immutable audit trail of all bids
- Links auction, player, team, and amount
- Timestamp for each bid
- Winning bid flag for transaction-safe updates

#### Matches

- Scheduled cricket matches between teams
- Type: T20, ODI, TEST
- Status: SCHEDULED, ONGOING, COMPLETED, CANCELLED
- Scores and winner tracking

#### MatchEvents

- Event-sourced scoring system
- Each event is immutable
- Sequence number for ordering
- JSON payload for flexible event data

### Relationships

```
User
├── team_manager_for → Team (1 to many)
├── player_profile → Player (1 to 1)
└── registration_tokens → RegistrationToken (1 to many)

Team
├── manager → User (many to 1)
├── players → Player (1 to many)
└── bids → Bid (1 to many)

Player
├── user → User (many to 1, optional)
├── team → Team (many to 1, optional)
└── bids → Bid (1 to many)

Auction
└── bids → Bid (1 to many)

Bid
├── auction → Auction (many to 1)
├── player → Player (many to 1)
└── team → Team (many to 1)

Match
└── match_events → MatchEvent (1 to many)
```

## Running Migrations

### Option 1: Using Helper Script

```bash
# From backend directory
python migrate.py upgrade         # Apply all pending migrations
python migrate.py downgrade       # Rollback 1 migration
python migrate.py downgrade -2    # Rollback 2 migrations
python migrate.py history         # View migration history
python migrate.py revision "description"  # Create new migration
```

### Option 2: Using Alembic Directly

```bash
# From backend directory
alembic upgrade head              # Apply all pending
alembic upgrade +1                # Apply 1 migration
alembic downgrade base            # Rollback all
alembic history --verbose         # View details
```

### Option 3: In Docker

```bash
# From project root
docker-compose exec backend python migrate.py upgrade
```

## Initial Migration

The initial migration (`001_initial_schema.py`) creates all tables and indexes:

- 8 tables (users, registration_tokens, teams, players, auctions, bids, matches, match_events)
- 7 PostgreSQL ENUM types for type safety
- Strategic indexes for query performance
- Proper foreign key constraints with cascade rules
- Timestamp tracking (created_at, updated_at) on all tables

## Creating New Migrations

### Manual Migration (no autogenerate)

```bash
alembic revision -m "description"
```

Then edit the generated file in `alembic/versions/` to add upgrade/downgrade logic.

### Auto Migration (requires Alembic to detect changes)

```bash
alembic revision --autogenerate -m "description"
```

This works best for SQLAlchemy model changes, but manual review is recommended.

## Database Indexes

Strategic indexes for query performance:

- **Users**: `(role, is_active)` - fast role-based filtering
- **Teams**: `(manager_id)` - find teams by manager
- **Players**: `(status)`, `(team_id)`, `(role)` - filtering and team membership
- **Auctions**: `(status)`, `(started_at, ended_at)` - status and timeline queries
- **Bids**: `(auction_id, player_id, is_winning_bid)` - auction results
- **Matches**: `(status)`, `(team_1_id, team_2_id)` - match lookups
- **MatchEvents**: `(match_id, sequence_number)` - event replay

## Important Notes

- **Do NOT edit migration files** after they've been applied to a database
- Always test migrations locally before deploying
- Migrations are applied in order by revision ID
- Foreign key constraints enforce referential integrity
- ENUM types in PostgreSQL provide type safety

## Troubleshooting

### Migration fails with "relation already exists"

The database was partially migrated. Rollback to start and retry.

### Alembic can't find models

Ensure `alembic/env.py` imports all models in the `# Import all models here` section.

### Can't create new migration

Verify:

1. PostgreSQL is running
2. `alembic.ini` has correct `sqlalchemy.url`
3. Models are imported in `alembic/env.py`

## Next Phase (PHASE 3)

PHASE 3 will add:

- User authentication endpoints
- Password hashing and verification
- JWT token generation and validation
- Registration token claim endpoints
