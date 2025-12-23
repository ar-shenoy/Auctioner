"""Bid model - represents bids in auctions."""

from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, Index, Boolean
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Bid(BaseModel):
    """
    Bid entity - represents a bid placed on a player during auction.
    Each bid is immutable once created (no updates).
    """
    
    __tablename__ = "bids"
    
    id = Column(String(36), primary_key=True, index=True)
    auction_id = Column(String(36), ForeignKey("auctions.id"), nullable=False, index=True)
    player_id = Column(String(36), ForeignKey("players.id"), nullable=False, index=True)
    team_id = Column(String(36), ForeignKey("teams.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # in smallest currency unit
    bid_timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    is_winning = Column(Boolean, nullable=False, default=False, index=True)
    
    # Relationships
    auction = relationship(
        "Auction",
        back_populates="bids",
        foreign_keys=[auction_id],
    )
    player = relationship(
        "Player",
        back_populates="bids",
        foreign_keys=[player_id],
    )
    team = relationship(
        "Team",
        back_populates="bids",
        foreign_keys=[team_id],
    )
    
    __table_args__ = (
        Index("idx_bid_auction_player", "auction_id", "player_id"),
        Index("idx_bid_team", "team_id"),
        Index("idx_bid_winning", "auction_id", "player_id", "is_winning"),
    )
