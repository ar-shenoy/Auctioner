from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.team import TeamCreate, TeamRead, TeamUpdate
from app.services.team_service import create_team, list_teams, get_team, update_team, delete_team
from app.dependencies.rbac import require_admin, require_any_authenticated_user, require_team_manager_or_admin


router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_team_endpoint(payload: TeamCreate, session: AsyncSession = Depends(get_session)):
    team = await create_team(session, payload)
    return team


@router.get("", response_model=List[TeamRead], dependencies=[Depends(require_any_authenticated_user)])
async def list_teams_endpoint(session: AsyncSession = Depends(get_session)):
    teams = await list_teams(session)
    return teams


@router.get("/{id}", response_model=TeamRead, dependencies=[Depends(require_any_authenticated_user)])
async def get_team_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    team = await get_team(session, id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team


@router.put("/{id}", response_model=TeamRead, dependencies=[Depends(require_team_manager_or_admin("id"))])
async def update_team_endpoint(id: str, payload: TeamUpdate, session: AsyncSession = Depends(get_session)):
    team = await update_team(session, id, payload)
    return team


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_team_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    await delete_team(session, id)
    return None
