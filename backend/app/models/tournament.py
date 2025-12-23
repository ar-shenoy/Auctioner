"""Tournament model - manages cricket tournaments."""

from sqlalchemy import Column, String, DateTime, Integer, CheckConstraint, Index

from app.models.base import BaseModel
from app.models.enums import TournamentStatusEnum


class Tournament(BaseModel):
    """Tournament entity - organizes teams and matches."""
    
    __tablename__ = "tournaments"
    
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    status = Column(String(20), nullable=False, default=TournamentStatusEnum.PLANNING.value, index=True)
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=True)
    num_teams = Column(Integer, nullable=False)
    num_players_per_team = Column(Integer, nullable=False)
    total_matches = Column(Integer, nullable=True)
    
    __table_args__ = (
        Index("idx_tournament_status", "status"),
        Index("idx_tournament_dates", "scheduled_start", "scheduled_end"),
        CheckConstraint(
            f"status IN ('{TournamentStatusEnum.PLANNING.value}', '{TournamentStatusEnum.REGISTRATION.value}', '{TournamentStatusEnum.AUCTION.value}', '{TournamentStatusEnum.MATCHES.value}', '{TournamentStatusEnum.COMPLETED.value}', '{TournamentStatusEnum.CANCELLED.value}')",
            name="ck_tournament_status",
        ),
    )
