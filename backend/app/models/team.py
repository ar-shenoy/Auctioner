"""Team model - represents cricket teams."""

from sqlalchemy import Column, String, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Team(BaseModel):
    """Team entity in the cricket management platform."""
    
    __tablename__ = "teams"
    
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    manager_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    budget_spent = Column(Integer, nullable=False, default=0)  # in smallest currency unit
    
    # Relationships
    manager = relationship(
        "User",
        back_populates="team_manager_for",
        foreign_keys=[manager_id],
    )
    players = relationship(
        "Player",
        back_populates="team",
        cascade="all, delete-orphan",
    )
    bids = relationship(
        "Bid",
        back_populates="team",
        cascade="all, delete-orphan",
    )
    
    __table_args__ = (
        Index("idx_team_manager", "manager_id"),
    )
