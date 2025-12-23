"""User model - represents all users (admins, managers, players)."""

from sqlalchemy import Column, String, Boolean, Index, CheckConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import RoleEnum


class User(BaseModel):
    """User entity for authentication and authorization."""
    
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default=RoleEnum.PLAYER.value, index=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    
    # Relationships
    team_manager_for = relationship(
        "Team",
        back_populates="manager",
        foreign_keys="Team.manager_id",
    )
    player_profile = relationship(
        "Player",
        back_populates="user",
        uselist=False,
        foreign_keys="Player.user_id",
    )
    registration_tokens = relationship(
        "RegistrationToken",
        back_populates="created_by_user",
        foreign_keys="RegistrationToken.created_by_user_id",
    )
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    
    __table_args__ = (
        Index("idx_user_role_active", "role", "is_active"),
        CheckConstraint(
            f"role IN ('{RoleEnum.ADMIN.value}', '{RoleEnum.TEAM_MANAGER.value}', '{RoleEnum.PLAYER.value}')",
            name="ck_user_role",
        ),
    )
