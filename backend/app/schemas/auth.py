"""Authentication request/response schemas."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Login request payload."""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response with token and user info."""
    access_token: str
    token_type: str = "bearer"
    user: dict
    
    class Config:
        from_attributes = True


class UserMeResponse(BaseModel):
    """Current user info response."""
    id: str
    email: str
    username: str
    full_name: str | None
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True
