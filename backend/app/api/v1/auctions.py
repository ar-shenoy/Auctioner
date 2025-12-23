from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, status, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.schemas.auction import AuctionCreate, AuctionRead, BidCreate, BidRead
from app.services.auction_service import (
    create_auction,
    start_auction,
    pause_auction,
    place_bid,
    end_auction,
    cancel_auction,
)
from app.dependencies.rbac import require_admin, require_team_manager, require_any_authenticated_user, get_current_user
from app.core.rate_limit import bid_limiter, rate_limit_response


router = APIRouter(prefix="/auctions", tags=["auctions"]) 


@router.post("", response_model=AuctionRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_auction_endpoint(payload: AuctionCreate, session: AsyncSession = Depends(get_session)):
    auction = await create_auction(session, payload.name, payload.description, str(payload.current_player_id))
    return auction


@router.post("/{id}/start", response_model=AuctionRead, dependencies=[Depends(require_admin)])
async def start_auction_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    auction = await start_auction(session, id)
    return auction


@router.post("/{id}/pause", response_model=AuctionRead, dependencies=[Depends(require_admin)])
async def pause_auction_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    auction = await pause_auction(session, id)
    return auction


@router.post("/{id}/bid", response_model=BidRead, status_code=status.HTTP_201_CREATED)
async def place_bid_endpoint(
    id: str,
    payload: BidCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
    _=Depends(require_team_manager),
):
    # Rate limiting: check bid limit
    if not await bid_limiter.enforce(request, "auction:bid"):
        return rate_limit_response()
    
    # require_team_manager enforces role; service enforces ownership
    bid = await place_bid(session, id, str(payload.team_id), payload.amount, payload.min_increment, current_user)
    return bid


@router.post("/{id}/end", response_model=AuctionRead, dependencies=[Depends(require_admin)])
async def end_auction_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    auction = await end_auction(session, id)
    return auction


@router.post("/{id}/cancel", response_model=AuctionRead, dependencies=[Depends(require_admin)])
async def cancel_auction_endpoint(id: str, session: AsyncSession = Depends(get_session)):
    auction = await cancel_auction(session, id)
    return auction


@router.get("", response_model=List[AuctionRead], dependencies=[Depends(require_any_authenticated_user)])
async def list_auctions(session: AsyncSession = Depends(get_session)):
    from app.models import Auction as AuctionModel
    result = await session.execute(select(AuctionModel).order_by(AuctionModel.created_at.desc()).limit(100))
    return result.scalars().all()


@router.get("/{id}", response_model=AuctionRead, dependencies=[Depends(require_any_authenticated_user)])
async def get_auction(id: str, session: AsyncSession = Depends(get_session)):
    from sqlalchemy import select
    from app.models import Auction as AuctionModel
    result = await session.execute(select(AuctionModel).where(AuctionModel.id == id))
    auction = result.scalars().first()
    if not auction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
    return auction
