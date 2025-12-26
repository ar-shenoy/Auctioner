from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models import Player, Team
from app.models.enums import PlayerStatusEnum, RoleEnum
from app.schemas.player import PlayerCreate, PlayerRead, PlayerUpdate
from app.services.player_service import create_player, list_players, get_player, update_player, delete_player
from app.dependencies.rbac import require_admin, require_any_authenticated_user, get_current_user


router = APIRouter(prefix="/players", tags=["players"])


@router.post("", response_model=PlayerRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_any_authenticated_user)])
async def create_player_endpoint(
    payload: PlayerCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user)
):
    # Check if user already has a player profile
    stmt = select(Player).where(Player.user_id == current_user.id)
    result = await session.execute(stmt)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a player profile"
        )

    # Force user_id and status
    payload.user_id = current_user.id
    payload.status = PlayerStatusEnum.AVAILABLE.value
    # Ensure team_id is None for new registration (self-register)
    payload.team_id = None

    player = await create_player(session, payload)
    return player


@router.get("", response_model=List[PlayerRead], dependencies=[Depends(require_any_authenticated_user)])
async def list_players_endpoint(session: AsyncSession = Depends(get_session)):
    players = await list_players(session)
    return players


@router.get("/{id}", response_model=PlayerRead, dependencies=[Depends(require_any_authenticated_user)])
async def get_player_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    player = await get_player(session, id)
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    return player


@router.put("/{id}", response_model=PlayerRead, dependencies=[Depends(require_any_authenticated_user)])
async def update_player_endpoint(
    id: str,
    payload: PlayerUpdate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Update player.
    - Admin: Can update all fields.
    - Team Manager: Can only update metadata (name, role) of players in their team.
      Cannot change status or transfer team.
    - Player: Cannot update (read-only self profile usually).
    """
    role = (current_user.role or "").lower()

    # 1. Admin Logic
    if role == RoleEnum.ADMIN.value:
        player = await update_player(session, id, payload)
        return player

    # 2. Team Manager Logic
    if role == RoleEnum.TEAM_MANAGER.value:
        # Check ownership of the player's team
        stmt = select(Player).where(Player.id == id)
        result = await session.execute(stmt)
        player = result.scalars().first()
        if not player:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

        if not player.team_id:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit unassigned players")

        stmt = select(Team).where(Team.id == player.team_id)
        result = await session.execute(stmt)
        team = result.scalars().first()

        if not team or team.manager_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not manage this player's team")

        # Enforce restrictions
        # Cannot change team_id
        if payload.team_id is not None and str(payload.team_id) != str(player.team_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot transfer players")

        # Cannot change status
        if payload.status is not None and payload.status != player.status:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change player status")

        # Cannot change base_price (auction related)
        if payload.base_price is not None and payload.base_price != player.base_price:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change base price")

        player = await update_player(session, id, payload)
        return player

    # 3. Player Logic (or others)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_player_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    await delete_player(session, id)
    return None
