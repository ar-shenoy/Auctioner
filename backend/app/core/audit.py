"""Audit logging utilities.

Provides `log_audit` to record important admin actions into `audit_logs` table.
Records: user_id, action, entity_type, entity_id, details, ip_address, timestamp.

Usage: await log_audit(session, user, action, entity_type, entity_id, details=None, ip=None)
"""
from typing import Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert

from app.models import AuditLog


async def log_audit(
    session: AsyncSession,
    user_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: str,
    details: Optional[str] = None,
    ip: Optional[str] = None,
) -> None:
    now = datetime.utcnow()
    stmt = insert(AuditLog).values(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip,
        timestamp=now,
    )
    await session.execute(stmt)
    await session.commit()
