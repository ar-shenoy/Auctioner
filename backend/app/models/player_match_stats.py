"""PlayerMatchStats model - per-match player statistics."""

from sqlalchemy import Column, String, Integer, ForeignKey, Index

from app.models.base import BaseModel


class PlayerMatchStats(BaseModel):
    """Player statistics for a specific match."""
    
    __tablename__ = "player_match_stats"
    
    id = Column(String(36), primary_key=True, index=True)
    player_id = Column(String(36), ForeignKey("players.id"), nullable=False)
    match_id = Column(String(36), ForeignKey("matches.id"), nullable=False)
    runs_scored = Column(Integer, nullable=True, default=0)
    balls_faced = Column(Integer, nullable=True, default=0)
    fours = Column(Integer, nullable=True, default=0)
    sixes = Column(Integer, nullable=True, default=0)
    wickets_taken = Column(Integer, nullable=True, default=0)
    runs_conceded = Column(Integer, nullable=True, default=0)
    balls_bowled = Column(Integer, nullable=True, default=0)
    
    __table_args__ = (
        Index("idx_player_match_stats", "player_id", "match_id"),
        Index("idx_match_stats_match", "match_id"),
    )
