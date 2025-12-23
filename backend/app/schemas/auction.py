from __future__ import annotations

from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, constr


UUIDStr = constr(pattern=r"^[0-9a-fA-F-]{36}$")


class AuctionCreate(BaseModel):
    name: constr(min_length=1, max_length=255)
    description: Optional[constr(max_length=1000)] = None
    current_player_id: UUID


class AuctionRead(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    status: str
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    current_player_id: Optional[UUID]
    current_bid: Optional[int]
    current_bidder_id: Optional[UUID]
    total_revenue: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class BidCreate(BaseModel):
    team_id: UUID
    amount: int = Field(..., gt=0)
    min_increment: int = Field(1, ge=1)


class BidRead(BaseModel):
    id: UUID
    auction_id: UUID
    player_id: UUID
    team_id: UUID
    amount: int
    bid_timestamp: datetime
    is_winning: bool

    class Config:
        orm_mode = True
