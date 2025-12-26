from __future__ import annotations

from typing import Optional
from datetime import datetime, date
from uuid import UUID

from pydantic import BaseModel, Field, constr, validator, HttpUrl

from app.models.enums import PlayerRoleEnum, BattingStyleEnum, BowlingStyleEnum, PlayerStatusEnum


class PlayerCreate(BaseModel):
    # Core Identity
    name: constr(min_length=1, max_length=255)
    date_of_birth: date
    nationality: constr(min_length=1, max_length=100)
    state: constr(min_length=1, max_length=100)
    city: constr(min_length=1, max_length=100)

    # Cricket Profile
    role: PlayerRoleEnum
    batting_style: BattingStyleEnum
    bowling_style: BowlingStyleEnum
    special_skills: Optional[str] = None

    # Performance Metrics
    matches_played: int = Field(default=0, ge=0)
    runs_scored: int = Field(default=0, ge=0)
    wickets_taken: int = Field(default=0, ge=0)
    strike_rate: float = Field(default=0.0, ge=0.0)
    economy_rate: float = Field(default=0.0, ge=0.0)

    # Auction Metadata
    base_price: int = Field(..., ge=0)
    expected_price: Optional[int] = Field(None, ge=0)
    availability_seasons: Optional[str] = None

    # Personal & Compliance
    phone_number: constr(min_length=10, max_length=20)
    bio: Optional[str] = None
    profile_photo_url: Optional[str] = None # Validated as URL in frontend/backend if needed. Using str for simplicity with strict Url type issues sometimes.

    # Internal fields handled by API, not user input
    user_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    status: Optional[str] = None
    is_approved: Optional[bool] = None


class PlayerUpdate(BaseModel):
    # Allow updating most fields
    name: Optional[constr(min_length=1, max_length=255)] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[constr(min_length=1, max_length=100)] = None
    state: Optional[constr(min_length=1, max_length=100)] = None
    city: Optional[constr(min_length=1, max_length=100)] = None

    role: Optional[PlayerRoleEnum] = None
    batting_style: Optional[BattingStyleEnum] = None
    bowling_style: Optional[BowlingStyleEnum] = None
    special_skills: Optional[str] = None

    matches_played: Optional[int] = Field(None, ge=0)
    runs_scored: Optional[int] = Field(None, ge=0)
    wickets_taken: Optional[int] = Field(None, ge=0)
    strike_rate: Optional[float] = Field(None, ge=0.0)
    economy_rate: Optional[float] = Field(None, ge=0.0)

    base_price: Optional[int] = Field(None, ge=0)
    expected_price: Optional[int] = Field(None, ge=0)
    availability_seasons: Optional[str] = None

    phone_number: Optional[constr(min_length=10, max_length=20)] = None
    bio: Optional[str] = None
    profile_photo_url: Optional[str] = None

    # Admin/Manager only fields
    team_id: Optional[UUID] = None
    status: Optional[str] = None
    is_approved: Optional[bool] = None


class PlayerRead(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    name: str
    role: str

    date_of_birth: Optional[date]
    nationality: Optional[str]
    state: Optional[str]
    city: Optional[str]

    batting_style: Optional[str]
    bowling_style: Optional[str]
    special_skills: Optional[str]

    matches_played: int
    runs_scored: int
    wickets_taken: int
    strike_rate: float
    economy_rate: float

    base_price: int
    expected_price: Optional[int]
    availability_seasons: Optional[str]

    phone_number: Optional[str]
    bio: Optional[str]
    profile_photo_url: Optional[str]

    is_approved: bool

    team_id: Optional[UUID]
    sold_price: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
