"""Player model - represents cricket players."""

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Index, CheckConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import PlayerRoleEnum, PlayerStatusEnum


class Player(BaseModel):
    """Player entity - represents cricket players in the platform."""
    
    __tablename__ = "players"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, unique=True)
    name = Column(String(255), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    base_price = Column(Integer, nullable=False)  # in smallest currency unit
    team_id = Column(String(36), ForeignKey("teams.id"), nullable=True)
    sold_price = Column(Integer, nullable=True)
    status = Column(
        String(20),
        nullable=False,
        default=PlayerStatusEnum.AVAILABLE.value,
        index=True,
    )
    statistics = Column(String(1000), nullable=True)  # JSON field
    
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
        CheckConstraint(
            f"role IN ('{PlayerRoleEnum.BATSMAN.value}', '{PlayerRoleEnum.BOWLER.value}', '{PlayerRoleEnum.ALL_ROUNDER.value}', '{PlayerRoleEnum.WICKET_KEEPER.value}')",
            name="ck_player_role",
        ),
        CheckConstraint(
            f"status IN ('{PlayerStatusEnum.AVAILABLE.value}', '{PlayerStatusEnum.SOLD.value}', '{PlayerStatusEnum.UNSOLD.value}')",
            name="ck_player_status",
        ),
    )
