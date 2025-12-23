"""AuditLog model - audit trail for compliance and debugging."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index, CheckConstraint, func
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import AuditActionEnum


class AuditLog(BaseModel):
    """Audit log for tracking all significant actions in the system."""
    
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)  # User, Team, Player, Auction, Bid, Match, etc.
    entity_id = Column(String(36), nullable=False, index=True)
    details = Column(String(1000), nullable=True)  # JSON details of what changed
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship(
        "User",
        back_populates="audit_logs",
        foreign_keys=[user_id],
    )
    
    __table_args__ = (
        Index("idx_audit_user_timestamp", "user_id", "timestamp"),
        Index("idx_audit_entity", "entity_type", "entity_id"),
        CheckConstraint(
            f"action IN ('{AuditActionEnum.CREATE.value}', '{AuditActionEnum.UPDATE.value}', '{AuditActionEnum.DELETE.value}', '{AuditActionEnum.LOGIN.value}', '{AuditActionEnum.LOGOUT.value}', '{AuditActionEnum.BID_PLACED.value}', '{AuditActionEnum.PLAYER_SOLD.value}', '{AuditActionEnum.MATCH_STARTED.value}', '{AuditActionEnum.MATCH_ENDED.value}')",
            name="ck_audit_action",
        ),
    )
