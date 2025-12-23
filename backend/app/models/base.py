"""Base model with common fields for all entities."""

from datetime import datetime
from sqlalchemy import Column, DateTime, func
from sqlalchemy.orm import declarative_base

from app.db.session import Base


class BaseModel(Base):
    """
    Abstract base class for all models.
    Provides common timestamp fields.
    """
    __abstract__ = True
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
