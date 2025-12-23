from __future__ import annotations

from typing import List, Optional
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Player
from app.schemas.player import PlayerCreate, PlayerUpdate


async def create_player(session: AsyncSession, payload: PlayerCreate) -> Player:
    player = Player(
        id=str(uuid4()),
        name=payload.name,
        role=payload.role,
        base_price=payload.base_price,
        team_id=str(payload.team_id) if payload.team_id else None,
        user_id=str(payload.user_id) if payload.user_id else None,
        status="available",
    )
    session.add(player)
    await session.commit()
    await session.refresh(player)
    return player


async def list_players(session: AsyncSession, limit: int = 100, offset: int = 0) -> List[Player]:
    result = await session.execute(select(Player).limit(limit).offset(offset))
    return result.scalars().all()


async def get_player(session: AsyncSession, player_id: str) -> Optional[Player]:
    result = await session.execute(select(Player).where(Player.id == player_id))
    return result.scalars().first()


async def update_player(session: AsyncSession, player_id: str, payload: PlayerUpdate) -> Player:
    player = await get_player(session, player_id)
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    if payload.name is not None:
        player.name = payload.name
    if payload.role is not None:
        player.role = payload.role
    if payload.base_price is not None:
        player.base_price = payload.base_price
    if payload.team_id is not None:
        player.team_id = str(payload.team_id)
    if payload.status is not None:
        player.status = payload.status

    session.add(player)
    await session.commit()
    await session.refresh(player)
    return player


async def delete_player(session: AsyncSession, player_id: str) -> None:
    player = await get_player(session, player_id)
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    if (player.status or "").lower() == "sold":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete a sold player")
    await session.delete(player)
    await session.commit()
