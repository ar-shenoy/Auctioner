from __future__ import annotations

from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, constr


class MatchCreate(BaseModel):
    name: constr(min_length=1, max_length=255)
    match_type: constr(pattern=r"^(t20|odi|test)$")
    team_1_id: UUID
    team_2_id: UUID
    scheduled_at: datetime


class MatchRead(BaseModel):
    id: UUID
    name: str
    match_type: str
    status: str
    team_1_id: UUID
    team_2_id: UUID
    scheduled_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    winner_team_id: Optional[UUID]
    team_1_score: Optional[int]
    team_2_score: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class MatchEventCreate(BaseModel):
    event_type: constr(pattern=r"^(match_started|innings_started|run_scored|wicket|over_completed|innings_ended|match_ended)$")
    event_data: Optional[str] = Field(None, max_length=2000)


class MatchEventRead(BaseModel):
    id: UUID
    match_id: UUID
    event_type: str
    sequence_number: int
    event_timestamp: datetime
    event_data: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
