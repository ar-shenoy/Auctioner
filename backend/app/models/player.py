"""Player model - represents cricket players."""

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Index, CheckConstraint, Date, Float, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import PlayerRoleEnum, PlayerStatusEnum, BattingStyleEnum, BowlingStyleEnum


class Player(BaseModel):
    """Player entity - represents cricket players in the platform."""
    
    __tablename__ = "players"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, unique=True)
    name = Column(String(255), nullable=False, index=True)
    role = Column(String(20), nullable=False)

    # New Profile Fields
    date_of_birth = Column(Date, nullable=True)
    nationality = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)

    # Cricket Profile
    batting_style = Column(String(20), nullable=True)
    bowling_style = Column(String(20), nullable=True)
    special_skills = Column(Text, nullable=True)

    # Performance Metrics
    matches_played = Column(Integer, default=0)
    runs_scored = Column(Integer, default=0)
    wickets_taken = Column(Integer, default=0)
    strike_rate = Column(Float, default=0.0)
    economy_rate = Column(Float, default=0.0)

    # Auction Metadata
    base_price = Column(Integer, nullable=False)  # in smallest currency unit
    expected_price = Column(Integer, nullable=True)
    availability_seasons = Column(String(500), nullable=True) # JSON or Comma-separated

    # Personal & Compliance
    phone_number = Column(String(20), nullable=True)
    bio = Column(Text, nullable=True)
    profile_photo_url = Column(String(500), nullable=True)

    # System
    is_approved = Column(Boolean, default=False, nullable=False, index=True)

    team_id = Column(String(36), ForeignKey("teams.id"), nullable=True)
    sold_price = Column(Integer, nullable=True)
    status = Column(
        String(20),
        nullable=False,
        default=PlayerStatusEnum.AVAILABLE.value,
        index=True,
    )
    statistics = Column(String(1000), nullable=True)  # JSON field (Legacy/Deprecated)
    
    # Relationships
    user = relationship(
        "User",
        back_populates="player_profile",
        foreign_keys=[user_id],
    )
    team = relationship(
        "Team",
        back_populates="players",
        foreign_keys=[team_id],
    )
    bids = relationship(
        "Bid",
        back_populates="player",
        cascade="all, delete-orphan",
    )
    match_stats = relationship(
        "PlayerMatchStats",
        cascade="all, delete-orphan",
    )
    career_stats = relationship(
        "PlayerCareerStats",
        uselist=False,
        cascade="all, delete-orphan",
    )
    
    __table_args__ = (
        Index("idx_player_status", "status"),
        Index("idx_player_team", "team_id"),
        Index("idx_player_role", "role"),
        Index("idx_player_approved", "is_approved"),
        CheckConstraint(
            f"role IN ('{PlayerRoleEnum.BATSMAN.value}', '{PlayerRoleEnum.BOWLER.value}', '{PlayerRoleEnum.ALL_ROUNDER.value}', '{PlayerRoleEnum.WICKET_KEEPER.value}')",
            name="ck_player_role",
        ),
        CheckConstraint(
            f"status IN ('{PlayerStatusEnum.AVAILABLE.value}', '{PlayerStatusEnum.SOLD.value}', '{PlayerStatusEnum.UNSOLD.value}')",
            name="ck_player_status",
        ),
    )
