from __future__ import annotations

from typing import List, Optional
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Team, User
from app.schemas.team import TeamCreate, TeamUpdate


async def create_team(session: AsyncSession, payload: TeamCreate) -> Team:
    # verify manager exists and is a team_manager
    result = await session.execute(select(User).where(User.id == str(payload.manager_id)))
    manager = result.scalars().first()
    if not manager:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager user not found")
    if (manager.role or "").lower() != "team_manager":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Manager must have team_manager role")

    team = Team(
        id=str(uuid4()),
        name=payload.name,
        description=payload.description,
        manager_id=str(payload.manager_id),
        budget_spent=0,
    )
    session.add(team)
    await session.commit()
    await session.refresh(team)
    return team


async def list_teams(session: AsyncSession, limit: int = 100, offset: int = 0) -> List[Team]:
    result = await session.execute(select(Team).limit(limit).offset(offset))
    return result.scalars().all()


async def get_team(session: AsyncSession, team_id: str) -> Optional[Team]:
    result = await session.execute(select(Team).where(Team.id == team_id))
    return result.scalars().first()


async def update_team(session: AsyncSession, team_id: str, payload: TeamUpdate) -> Team:
    team = await get_team(session, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    if payload.manager_id is not None:
        result = await session.execute(select(User).where(User.id == str(payload.manager_id)))
        manager = result.scalars().first()
        if not manager:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager user not found")
        if (manager.role or "").lower() != "team_manager":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Manager must have team_manager role")
        team.manager_id = str(payload.manager_id)

    if payload.name is not None:
        team.name = payload.name
    if payload.description is not None:
        team.description = payload.description

    session.add(team)
    await session.commit()
    await session.refresh(team)
    return team


async def delete_team(session: AsyncSession, team_id: str) -> None:
    team = await get_team(session, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    await session.delete(team)
    await session.commit()
