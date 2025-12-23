from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.match import MatchCreate, MatchRead, MatchEventCreate, MatchEventRead
from app.services.match_service import (
    create_match,
    start_match,
    record_event,
    end_match,
    correct_event,
)
from app.dependencies.rbac import require_admin, require_any_authenticated_user, require_team_manager, get_current_user
from app.models import Match as MatchModel, MatchEvent as MatchEventModel


router = APIRouter(prefix="/matches", tags=["matches"])


@router.post("", response_model=MatchRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_match_endpoint(
    payload: MatchCreate,
    session: AsyncSession = Depends(get_session),
):
    match = await create_match(session, payload.name, payload.match_type, str(payload.team_1_id), str(payload.team_2_id), payload.scheduled_at)
    return match


@router.post("/{id}/start", response_model=MatchRead, dependencies=[Depends(require_admin)])
async def start_match_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    match = await start_match(session, id)
    return match


@router.post("/{id}/events", response_model=MatchEventRead, status_code=status.HTTP_201_CREATED)
async def record_event_endpoint(
    id: str,
    payload: MatchEventCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
    _=Depends(require_admin),  # For now, restrict to admin; team_manager can be added with ownership checks
):
    event = await record_event(session, id, payload.event_type, payload.event_data)
    return event


@router.post("/{id}/correct", response_model=MatchEventRead, dependencies=[Depends(require_admin)])
async def correct_event_endpoint(
    id: str,
    event_id: str,
    payload: MatchEventCreate,
    session: AsyncSession = Depends(get_session),
):
    correction = await correct_event(session, id, event_id, payload.event_data)
    return correction


@router.post("/{id}/end", response_model=MatchRead, dependencies=[Depends(require_admin)])
async def end_match_endpoint(
    id: str,
    session: AsyncSession = Depends(get_session),
    winner_team_id: Optional[str] = None,
):
    match = await end_match(session, id, winner_team_id)
    return match


@router.get("", response_model=List[MatchRead], dependencies=[Depends(require_any_authenticated_user)])
async def list_matches(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(MatchModel).order_by(MatchModel.created_at.desc()).limit(100))
    return result.scalars().all()


@router.get("/{id}", response_model=MatchRead, dependencies=[Depends(require_any_authenticated_user)])
async def get_match(id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(MatchModel).where(MatchModel.id == id))
    match = result.scalars().first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match
