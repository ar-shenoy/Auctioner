"""RegistrationToken model - admin-controlled registration tokens."""

from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, func, Index
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class RegistrationToken(BaseModel):
    """
    Registration token for user sign-up.
    Only admins can create these tokens.
    Each token can be used once to register a user.
    """
    
    __tablename__ = "registration_tokens"
    
    id = Column(String(36), primary_key=True, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    used_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_used = Column(Boolean, nullable=False, default=False, index=True)
    
    # Relationships
    created_by_user = relationship(
        "User",
        back_populates="registration_tokens",
        foreign_keys=[created_by_user_id],
    )
    used_by_user = relationship(
        "User",
        foreign_keys=[used_by_user_id],
    )
    
    __table_args__ = (
        Index("idx_token_expires", "token", "expires_at"),
        Index("idx_token_used", "is_used", "expires_at"),
    )
