from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models import Player, Team
from app.models.enums import PlayerStatusEnum, RoleEnum, AuditActionEnum
from app.schemas.player import PlayerCreate, PlayerRead, PlayerUpdate
from app.services.player_service import create_player, list_players, get_player, update_player, delete_player
from app.dependencies.rbac import require_admin, require_any_authenticated_user, get_current_user, get_current_user_optional
from app.core.audit import log_audit


router = APIRouter(prefix="/players", tags=["players"])


@router.post("", response_model=PlayerRead, status_code=status.HTTP_201_CREATED)
async def create_player_endpoint(
    payload: PlayerCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user_optional)
):
    # Force status to AVAILABLE for new registrations
    payload.status = PlayerStatusEnum.AVAILABLE.value
    payload.team_id = None

    # Enforce is_approved=False for non-admins
    is_admin = current_user and (current_user.role or "").lower() == RoleEnum.ADMIN.value
    if not is_admin:
        payload.is_approved = False

    user_id_for_audit = "public"

    if current_user:
        # If authenticated, link to user and check duplicates
        stmt = select(Player).where(Player.user_id == current_user.id)
        result = await session.execute(stmt)
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a player profile"
            )
        payload.user_id = current_user.id
        user_id_for_audit = current_user.id
    else:
        # Public registration - user_id is None
        payload.user_id = None

    player = await create_player(session, payload)

    # Audit log (if user is authenticated, else log as 'public')
    if user_id_for_audit != "public":
        await log_audit(session, user_id_for_audit, AuditActionEnum.CREATE, "player", player.id, "Self-registration")

    return player


@router.get("", response_model=List[PlayerRead])
async def list_players_endpoint(
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user_optional)
):
    # Filter logic:
    # Admin: All players
    # Public/Manager/Player: All Approved players (AVAILABLE/SOLD/UNSOLD)

    role = (current_user.role or "").lower() if current_user else "public"

    if role == RoleEnum.ADMIN.value:
         players = await list_players(session)
         return players

    if role == RoleEnum.TEAM_MANAGER.value:
        # Managers see approved players in the pool
        stmt = select(Player).where(Player.is_approved == True)
        result = await session.execute(stmt)
        return result.scalars().all()

    # Players logic: Currently standard is seeing all or restricted?
    # Requirement: "Player can View own profile". Doesn't strictly forbid viewing others, but "Auction pool" is mentioned for Manager.
    # Safe default: Players see all approved players (like public pool) or just themselves.
    # Let's return all approved for now to support generic lists, or filter if needed.
    # Actually, for "My Profile", they fetch /players/{id}.
    # Let's return approved players for general list.
    stmt = select(Player).where(Player.is_approved == True)
    result = await session.execute(stmt)
    return result.scalars().all()


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
    - Player: Can update their OWN profile ONLY if Status is AVAILABLE.
    """
    role = (current_user.role or "").lower()

    # Fetch player first
    stmt = select(Player).where(Player.id == id)
    result = await session.execute(stmt)
    player = result.scalars().first()
    if not player:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    # 1. Admin Logic
    if role == RoleEnum.ADMIN.value:
        # Admin can update anything.
        updated_player = await update_player(session, id, payload)
        await log_audit(session, current_user.id, AuditActionEnum.UPDATE, "player", id, "Admin update")
        return updated_player

    # 2. Team Manager Logic
    if role == RoleEnum.TEAM_MANAGER.value:
        if not player.team_id:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit unassigned players")

        stmt = select(Team).where(Team.id == player.team_id)
        result = await session.execute(stmt)
        team = result.scalars().first()

        if not team or team.manager_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not manage this player's team")

        # Restrictions
        if payload.team_id is not None and str(payload.team_id) != str(player.team_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot transfer players")
        if payload.status is not None and payload.status != player.status:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change player status")
        if payload.base_price is not None and payload.base_price != player.base_price:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change base price")
        if payload.is_approved is not None:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot approve players")

        updated_player = await update_player(session, id, payload)
        await log_audit(session, current_user.id, AuditActionEnum.UPDATE, "player", id, "Manager update")
        return updated_player

    # 3. Player Logic (Self-Edit)
    if role == RoleEnum.PLAYER.value:
        if player.user_id != current_user.id:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit other players")

        # Check Status
        if player.status != PlayerStatusEnum.AVAILABLE.value:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit profile after being sold/unsold")

        # Prevent critical field edits
        if payload.status is not None or payload.team_id is not None or payload.is_approved is not None:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change critical fields")

        updated_player = await update_player(session, id, payload)
        await log_audit(session, current_user.id, AuditActionEnum.UPDATE, "player", id, "Self update")
        return updated_player

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")


@router.patch("/{id}/approve", response_model=PlayerRead, dependencies=[Depends(require_admin)])
async def approve_player_endpoint(
    id: str,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user)
):
    stmt = select(Player).where(Player.id == id)
    result = await session.execute(stmt)
    player = result.scalars().first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    player.is_approved = True
    session.add(player)
    await session.commit()
    await session.refresh(player)

    await log_audit(session, current_user.id, AuditActionEnum.PLAYER_APPROVED, "player", id, "Approved")
    return player


@router.patch("/{id}/reject", response_model=PlayerRead, dependencies=[Depends(require_admin)])
async def reject_player_endpoint(
    id: str,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user)
):
    stmt = select(Player).where(Player.id == id)
    result = await session.execute(stmt)
    player = result.scalars().first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    player.is_approved = False
    session.add(player)
    await session.commit()
    await session.refresh(player)

    await log_audit(session, current_user.id, AuditActionEnum.PLAYER_REJECTED, "player", id, "Rejected")
    return player


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_player_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    await delete_player(session, id)
    return None
