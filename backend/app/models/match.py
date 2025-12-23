"""Match model - represents cricket matches."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Index, CheckConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import MatchStatusEnum, MatchTypeEnum


class Match(BaseModel):
    """Match entity - represents cricket matches."""
    
    __tablename__ = "matches"
    
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    match_type = Column(String(20), nullable=False)
    status = Column(
        String(20),
        nullable=False,
        default=MatchStatusEnum.SCHEDULED.value,
        index=True,
    )
    team_1_id = Column(String(36), ForeignKey("teams.id"), nullable=False)
    team_2_id = Column(String(36), ForeignKey("teams.id"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    winner_team_id = Column(String(36), ForeignKey("teams.id"), nullable=True)
    team_1_score = Column(Integer, nullable=True, default=0)
    team_2_score = Column(Integer, nullable=True, default=0)
    
    # Relationships
    match_events = relationship(
        "MatchEvent",
        back_populates="match",
        cascade="all, delete-orphan",
    )
    
    __table_args__ = (
        Index("idx_match_status", "status"),
        Index("idx_match_scheduled", "scheduled_at"),
        Index("idx_match_teams", "team_1_id", "team_2_id"),
        CheckConstraint(
            f"match_type IN ('{MatchTypeEnum.T20.value}', '{MatchTypeEnum.ODI.value}', '{MatchTypeEnum.TEST.value}')",
            name="ck_match_type",
        ),
        CheckConstraint(
            f"status IN ('{MatchStatusEnum.SCHEDULED.value}', '{MatchStatusEnum.ONGOING.value}', '{MatchStatusEnum.COMPLETED.value}', '{MatchStatusEnum.CANCELLED.value}')",
            name="ck_match_status",
        ),
    )
