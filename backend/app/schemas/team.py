from __future__ import annotations

from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, constr, validator


UUIDStr = constr(pattern=r"^[0-9a-fA-F-]{36}$")


class TeamCreate(BaseModel):
    name: constr(min_length=1, max_length=255)
    description: Optional[constr(max_length=1000)] = None
    manager_id: UUID

    @validator("manager_id")
    def valid_uuid(cls, v: UUID) -> UUID:
        return v


class TeamUpdate(BaseModel):
    name: Optional[constr(min_length=1, max_length=255)] = None
    description: Optional[constr(max_length=1000)] = None
    manager_id: Optional[UUID] = None


class TeamRead(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    manager_id: UUID
    budget_spent: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
