"""RefreshToken model - JWT refresh tokens for authentication."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class RefreshToken(BaseModel):
    """Refresh token for JWT authentication (Phase 3)."""
    
    __tablename__ = "refresh_tokens"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    revoked = Column(Boolean, nullable=False, default=False, index=True)
    
    # Relationships
    user = relationship(
        "User",
        back_populates="refresh_tokens",
        foreign_keys=[user_id],
    )
    
    __table_args__ = (
        Index("idx_refresh_token_user_active", "user_id", "revoked"),
    )
