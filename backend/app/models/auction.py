"""Auction model - represents auctions for players."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Index, CheckConstraint

from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import AuctionStatusEnum


class Auction(BaseModel):
    """Auction entity - manages player auctions."""
    
    __tablename__ = "auctions"
    
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    status = Column(
        String(20),
        nullable=False,
        default=AuctionStatusEnum.SCHEDULED.value,
        index=True,
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    current_player_id = Column(String(36), ForeignKey("players.id"), nullable=True)
    current_bid = Column(Integer, nullable=True)  # Current highest bid amount
    current_bidder_id = Column(String(36), ForeignKey("teams.id"), nullable=True)  # Team with highest bid
    total_revenue = Column(Integer, nullable=False, default=0)
    
    # Relationships
    bids = relationship(
        "Bid",
        back_populates="auction",
        cascade="all, delete-orphan",
    )
    
    __table_args__ = (
        Index("idx_auction_status", "status"),
        Index("idx_auction_dates", "started_at", "ended_at"),
        Index("idx_auction_current_bid", "current_player_id", "current_bid"),
        CheckConstraint(
            f"status IN ('{AuctionStatusEnum.SCHEDULED.value}', '{AuctionStatusEnum.ONGOING.value}', '{AuctionStatusEnum.PAUSED.value}', '{AuctionStatusEnum.COMPLETED.value}')",
            name="ck_auction_status",
        ),
    )
