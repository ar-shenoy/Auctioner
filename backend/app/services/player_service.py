from __future__ import annotations

from typing import List, Optional
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Player
from app.schemas.player import PlayerCreate, PlayerUpdate


async def create_player(session: AsyncSession, payload: PlayerCreate) -> Player:
    data = payload.model_dump(exclude_unset=True)

    # Handle UUIDs
    if 'team_id' in data and data['team_id']:
        data['team_id'] = str(data['team_id'])
    if 'user_id' in data and data['user_id']:
        data['user_id'] = str(data['user_id'])

    # Default status
    if 'status' not in data:
        data['status'] = "available"

    # Remove computed fields if any (none in Create)

    player = Player(
        id=str(uuid4()),
        **data
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

    update_data = payload.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if key in ['team_id', 'user_id'] and value is not None:
            setattr(player, key, str(value))
        else:
            setattr(player, key, value)

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
