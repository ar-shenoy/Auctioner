from __future__ import annotations

from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, constr, validator


class PlayerCreate(BaseModel):
    name: constr(min_length=1, max_length=255)
    role: constr(min_length=3, max_length=20)
    base_price: int = Field(..., ge=0)
    team_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class PlayerUpdate(BaseModel):
    name: Optional[constr(min_length=1, max_length=255)] = None
    role: Optional[constr(min_length=3, max_length=20)] = None
    base_price: Optional[int] = Field(None, ge=0)
    team_id: Optional[UUID] = None
    status: Optional[constr(min_length=3, max_length=20)] = None


class PlayerRead(BaseModel):
    id: UUID
    name: str
    role: str
    base_price: int
    team_id: Optional[UUID]
    user_id: Optional[UUID]
    sold_price: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
