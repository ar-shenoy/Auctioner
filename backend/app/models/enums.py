"""Enums for the application - Python enums for type safety."""

from enum import Enum


class RoleEnum(str, Enum):
    """User roles in the system."""
    ADMIN = "admin"
    TEAM_MANAGER = "team_manager"
    PLAYER = "player"


class PlayerRoleEnum(str, Enum):
    """Player roles in cricket."""
    BATSMAN = "batsman"
    BOWLER = "bowler"
    ALL_ROUNDER = "all_rounder"
    WICKET_KEEPER = "wicket_keeper"


class PlayerStatusEnum(str, Enum):
    """Player auction status."""
    AVAILABLE = "available"
    SOLD = "sold"
    UNSOLD = "unsold"


class AuctionStatusEnum(str, Enum):
    """Auction status."""
    SCHEDULED = "scheduled"
    ONGOING = "ongoing"
    PAUSED = "paused"
    COMPLETED = "completed"


class MatchStatusEnum(str, Enum):
    """Match status."""
    SCHEDULED = "scheduled"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MatchTypeEnum(str, Enum):
    """Match type."""
    T20 = "t20"
    ODI = "odi"
    TEST = "test"


class EventTypeEnum(str, Enum):
    """Types of match events for event sourcing."""
    MATCH_STARTED = "match_started"
    INNINGS_STARTED = "innings_started"
    RUN_SCORED = "run_scored"
    WICKET = "wicket"
    OVER_COMPLETED = "over_completed"
    INNINGS_ENDED = "innings_ended"
    MATCH_ENDED = "match_ended"


class TournamentStatusEnum(str, Enum):
    """Tournament status."""
    PLANNING = "planning"
    REGISTRATION = "registration"
    AUCTION = "auction"
    MATCHES = "matches"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AuditActionEnum(str, Enum):
    """Types of audit actions."""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    BID_PLACED = "bid_placed"
    PLAYER_SOLD = "player_sold"
    MATCH_STARTED = "match_started"
    MATCH_ENDED = "match_ended"
