# PHASE 2 - Database Models & Alembic Migrations

## Completion Summary

### Models Created (8 entities)

1. **[app/models/base.py](app/models/base.py)** - BaseModel

   - Abstract base for all models
   - Automatic created_at/updated_at timestamps

2. **[app/models/user.py](app/models/user.py)** - User

   - Roles: ADMIN, TEAM_MANAGER, PLAYER
   - Email & username (unique)
   - Password hash (ready for Phase 3)
   - Active/inactive status

3. **[app/models/registration_token.py](app/models/registration_token.py)** - RegistrationToken

   - Admin-created tokens for sign-up
   - Expires_at timestamp
   - Track who created and who used token
   - is_used flag (one-time use)

4. **[app/models/team.py](app/models/team.py)** - Team

   - Named teams with manager (TEAM_MANAGER user)
   - Budget tracking
   - Players relationship

5. **[app/models/player.py](app/models/player.py)** - Player

   - Roles: BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER
   - Status: AVAILABLE, SOLD, UNSOLD
   - Base price & sold price (integers for currency)
   - Optional link to User account

6. **[app/models/auction.py](app/models/auction.py)** - Auction

   - Status: SCHEDULED, ONGOING, PAUSED, COMPLETED
   - Timeline: started_at, ended_at
   - Current player being auctioned
   - Total revenue tracking

7. **[app/models/bid.py](app/models/bid.py)** - Bid

   - Immutable bid records
   - Links: auction, player, team, amount
   - Timestamp and winning flag

8. **[app/models/match.py](app/models/match.py)** - Match

   - Type: T20, ODI, TEST
   - Status: SCHEDULED, ONGOING, COMPLETED, CANCELLED
   - Teams, scores, winner, timeline

9. **[app/models/match_event.py](app/models/match_event.py)** - MatchEvent
   - Event-sourced scoring
   - Type: MATCH_STARTED, INNINGS_STARTED, RUN_SCORED, WICKET, etc.
   - Sequence number for ordering
   - JSON event_data payload

### Alembic Setup

1. **[alembic.ini](alembic.ini)** - Configuration file

   - SQLAlchemy URL configuration
   - Logging setup

2. **[alembic/env.py](alembic/env.py)** - Alembic environment

   - Async SQLAlchemy support
   - Model imports for autogenerate
   - Environment variable loading

3. **[alembic/script.py.mako](alembic/script.py.mako)** - Migration template

4. **[alembic/versions/001_initial_schema.py](alembic/versions/001_initial_schema.py)** - Initial migration
   - Creates all tables with proper constraints
   - 7 PostgreSQL ENUM types
   - Strategic indexes for performance
   - Reversible downgrade logic

### Helper Files

1. **[migrate.py](migrate.py)** - Migration CLI

   - `python migrate.py upgrade` - Apply migrations
   - `python migrate.py downgrade` - Rollback migrations
   - `python migrate.py revision "message"` - Create new migration
   - `python migrate.py history` - View history

2. **[MIGRATIONS.md](MIGRATIONS.md)** - Migration documentation
   - Schema overview
   - Entity relationships diagram
   - Usage examples
   - Troubleshooting guide

## Database Schema Highlights

### ENUM Types (Type Safety)

- `role_enum`: admin, team_manager, player
- `player_role_enum`: batsman, bowler, all_rounder, wicket_keeper
- `player_status_enum`: available, sold, unsold
- `auction_status_enum`: scheduled, ongoing, paused, completed
- `match_status_enum`: scheduled, ongoing, completed, cancelled
- `match_type_enum`: t20, odi, test
- `event_type_enum`: match_started, innings_started, run_scored, wicket, over_completed, innings_ended, match_ended

### Performance Indexes

- Users: `(role, is_active)` - Role-based filtering
- Teams: `(manager_id)` - Find by manager
- Players: `(status)`, `(team_id)`, `(role)` - Various filtering
- Auctions: `(status)`, `(started_at, ended_at)` - Status & timeline
- Bids: `(auction_id, player_id, is_winning_bid)` - Auction results
- Matches: `(status)`, `(team_1_id, team_2_id)` - Match lookups
- MatchEvents: `(match_id, sequence_number)` - Event replay

### Key Design Decisions

✓ **Immutable Bids** - Once created, bids cannot be changed (audit trail)
✓ **Event Sourcing** - MatchEvents allow replaying match history
✓ **Atomic Transactions** - Foreign keys and constraints ensure integrity
✓ **Type Safety** - PostgreSQL ENUMs prevent invalid states
✓ **Timestamps** - All records track creation and modification
✓ **Flexible Relationships** - Players, tokens, matches use optional FKs where appropriate
✓ **Currency as Integers** - Prices use smallest unit to avoid float precision issues

## Testing the Setup

### 1. Start Docker Compose

```bash
cd ..  # Go to project root
docker-compose up --build
```

### 2. Apply Migrations (Inside Docker)

```bash
docker-compose exec backend python migrate.py upgrade
```

### 3. Verify Database

```bash
docker-compose exec postgres psql -U admin -d cricket_db -c "\dt"
```

Expected output: 8 tables (users, registration_tokens, teams, players, auctions, bids, matches, match_events)

### 4. Check Health

```bash
curl http://localhost:8000/health
```

## What's NOT in PHASE 2

- ❌ Authentication/JWT (Phase 3)
- ❌ API endpoints (Phase 3+)
- ❌ Business logic/services (Phase 3+)
- ❌ WebSockets (Phase 8)
- ❌ Tests (Phase 9)

## Next: PHASE 3

Ready to proceed with:

- User authentication & JWT tokens
- Registration token validation
- Admin registration token management
- RBAC enforcement

---

**PHASE 2 COMPLETE** ✓
Database models and migrations are ready.
All models follow SQLAlchemy async patterns.
Initial schema can be applied to PostgreSQL.
