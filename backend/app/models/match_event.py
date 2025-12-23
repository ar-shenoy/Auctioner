"""MatchEvent model - event-sourced match scoring."""

from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, Index, CheckConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import EventTypeEnum


class MatchEvent(BaseModel):
    """
    Match event for event-sourced scoring.
    Each event is immutable and represents a single action during the match.
    Replaying all events reconstructs the match state.
    """
    
    __tablename__ = "match_events"
    
    id = Column(String(36), primary_key=True, index=True)
    match_id = Column(String(36), ForeignKey("matches.id"), nullable=False, index=True)
    event_type = Column(String(30), nullable=False, index=True)
    sequence_number = Column(Integer, nullable=False)  # Order of events
    event_timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    event_data = Column(String(2000), nullable=True)  # JSON payload
    
    # Relationships
    match = relationship(
        "Match",
        back_populates="match_events",
        foreign_keys=[match_id],
    )
    
    __table_args__ = (
        Index("idx_event_match_sequence", "match_id", "sequence_number"),
        Index("idx_event_type", "event_type"),
        CheckConstraint(
            f"event_type IN ('{EventTypeEnum.MATCH_STARTED.value}', '{EventTypeEnum.INNINGS_STARTED.value}', '{EventTypeEnum.RUN_SCORED.value}', '{EventTypeEnum.WICKET.value}', '{EventTypeEnum.OVER_COMPLETED.value}', '{EventTypeEnum.INNINGS_ENDED.value}', '{EventTypeEnum.MATCH_ENDED.value}')",
            name="ck_event_type",
        ),
    )
