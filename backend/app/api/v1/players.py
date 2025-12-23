from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.player import PlayerCreate, PlayerRead, PlayerUpdate
from app.services.player_service import create_player, list_players, get_player, update_player, delete_player
from app.dependencies.rbac import require_admin, require_any_authenticated_user


router = APIRouter(prefix="/players", tags=["players"])


@router.post("", response_model=PlayerRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_player_endpoint(payload: PlayerCreate, session: AsyncSession = Depends(get_session)):
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


@router.put("/{id}", response_model=PlayerRead, dependencies=[Depends(require_admin)])
async def update_player_endpoint(id: str, payload: PlayerUpdate, session: AsyncSession = Depends(get_session)):
    player = await update_player(session, id, payload)
    return player


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_player_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    await delete_player(session, id)
    return None
