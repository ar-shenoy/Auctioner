from __future__ import annotations

from datetime import datetime, timedelta
from typing import List
import secrets
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.dependencies.rbac import require_admin
from app.models import RegistrationToken
from app.schemas.admin import RegistrationTokenCreate, RegistrationTokenRead
from app.core.audit import log_audit


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/registration-tokens", response_model=RegistrationTokenRead, status_code=status.HTTP_201_CREATED)
async def create_registration_token(
    payload: RegistrationTokenCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(require_admin),
):
    token_id = str(uuid4())
    token_value = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=payload.expires_minutes)

    reg = RegistrationToken(
        id=token_id,
        token=token_value,
        created_by_user_id=current_user.id,
        expires_at=expires_at,
        is_used=False,
    )
    session.add(reg)
    await session.commit()
    await session.refresh(reg)

    # Audit log
    await log_audit(
        session=session,
        user_id=current_user.id,
        action="create_registration_token",
        entity_type="registration_token",
        entity_id=reg.id,
        details=f"expires_at={reg.expires_at.isoformat()}",
    )

    return reg


@router.get("/registration-tokens", response_model=List[RegistrationTokenRead])
async def list_registration_tokens(
    session: AsyncSession = Depends(get_session),
    current_user=Depends(require_admin),
):
    result = await session.execute(select(RegistrationToken).order_by(RegistrationToken.created_at.desc()))
    tokens = result.scalars().all()
    return tokens


@router.delete("/registration-tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_registration_token(
    token_id: str,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(require_admin),
):
    result = await session.execute(select(RegistrationToken).where(RegistrationToken.id == token_id))
    token = result.scalars().first()
    if not token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration token not found")

    # delete token (admin revocation)
    await session.delete(token)
    await session.commit()

    # Audit log
    await log_audit(
        session=session,
        user_id=current_user.id,
        action="revoke_registration_token",
        entity_type="registration_token",
        entity_id=token_id,
        details=None,
    )

    return None
