"""PlayerCareerStats model - aggregate career player statistics."""

from sqlalchemy import Column, String, Integer, ForeignKey, UniqueConstraint, Index

from app.models.base import BaseModel


class PlayerCareerStats(BaseModel):
    """Aggregate career statistics for a player across all matches."""
    
    __tablename__ = "player_career_stats"
    
    id = Column(String(36), primary_key=True, index=True)
    player_id = Column(String(36), ForeignKey("players.id"), nullable=False, unique=True)
    total_matches = Column(Integer, nullable=False, default=0)
    total_runs = Column(Integer, nullable=False, default=0)
    total_balls_faced = Column(Integer, nullable=False, default=0)
    total_fours = Column(Integer, nullable=False, default=0)
    total_sixes = Column(Integer, nullable=False, default=0)
    total_wickets = Column(Integer, nullable=False, default=0)
    total_runs_conceded = Column(Integer, nullable=False, default=0)
    total_balls_bowled = Column(Integer, nullable=False, default=0)
    strike_rate = Column(Integer, nullable=True)  # Stored as int (e.g., 120 = 120%)
    average = Column(Integer, nullable=True)  # Stored as int (e.g., 45 = 45.0)
    
    __table_args__ = (
        UniqueConstraint("player_id", name="uq_player_career_stats"),
        Index("idx_career_stats_player", "player_id"),
    )
