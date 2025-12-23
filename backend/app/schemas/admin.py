from __future__ import annotations

from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class RegistrationTokenCreate(BaseModel):
    expires_minutes: Optional[int] = 1440  # default 1 day


class RegistrationTokenRead(BaseModel):
    id: str
    token: str
    created_by_user_id: str
    used_by_user_id: Optional[str]
    expires_at: datetime
    is_used: bool
    created_at: datetime

    class Config:
        orm_mode = True
