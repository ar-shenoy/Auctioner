from __future__ import annotations

from typing import Optional
from uuid import uuid4
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import HTTPException, status

from app.models import Auction, Bid, Team, Player
from app.models.enums import AuctionStatusEnum
from app.websocket.manager import manager


async def create_auction(session: AsyncSession, name: str, description: Optional[str], player_id: str) -> Auction:
    auction = Auction(
        id=str(uuid4()),
        name=name,
        description=description,
        status=AuctionStatusEnum.SCHEDULED.value,
        current_player_id=player_id,
        current_bid=None,
        current_bidder_id=None,
        total_revenue=0,
    )
    session.add(auction)
    await session.commit()
    await session.refresh(auction)
    return auction


async def start_auction(session: AsyncSession, auction_id: str) -> Auction:
    async with session.begin():
        stmt = select(Auction).where(Auction.id == auction_id).with_for_update()
        res = await session.execute(stmt)
        auction = res.scalars().first()
        if not auction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
        if auction.status == AuctionStatusEnum.ONGOING.value:
            return auction
        auction.status = AuctionStatusEnum.ONGOING.value
        auction.started_at = datetime.utcnow()
        session.add(auction)
    await session.refresh(auction)

    # Broadcast after successful commit
    payload = {
        "type": "auction_started",
        "auction_id": auction.id,
        "status": auction.status,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_room(f"auction:{auction_id}", payload)

    return auction


async def pause_auction(session: AsyncSession, auction_id: str) -> Auction:
    async with session.begin():
        stmt = select(Auction).where(Auction.id == auction_id).with_for_update()
        res = await session.execute(stmt)
        auction = res.scalars().first()
        if not auction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
        auction.status = AuctionStatusEnum.PAUSED.value
        session.add(auction)
    await session.refresh(auction)

    # Broadcast after successful commit
    payload = {
        "type": "auction_paused",
        "auction_id": auction.id,
        "status": auction.status,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_room(f"auction:{auction_id}", payload)

    return auction


async def _sum_pending_bids_other_auctions(session: AsyncSession, team_id: str, exclude_auction_id: str) -> int:
    """Sum winning bids on other ongoing/paused auctions.
    
    Pending budget = SUM(Bid.amount) WHERE:
    - Bid.is_winning = true
    - Auction.status IN ('ongoing', 'paused')
    - Auction.id != exclude_auction_id
    """
    stmt = (
        select(func.coalesce(func.sum(Bid.amount), 0))
        .join(Auction, Bid.auction_id == Auction.id)
        .where(
            Bid.team_id == team_id,
            Bid.is_winning == True,
            Auction.status.in_([AuctionStatusEnum.ONGOING.value, AuctionStatusEnum.PAUSED.value]),
            Auction.id != exclude_auction_id,
        )
    )
    res = await session.execute(stmt)
    return int(res.scalar() or 0)


async def place_bid(
    session: AsyncSession,
    auction_id: str,
    team_id: str,
    amount: int,
    min_increment: int,
    current_user=None,
) -> Bid:
    """Place a bid atomically following the rules in the service contract.

    Performs SELECT ... FOR UPDATE on auction and team, validates budget,
    toggles previous winning bid, inserts new bid, updates auction current bid.
    """
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")

    async with session.begin():
        # Lock auction
        stmt = select(Auction).where(Auction.id == auction_id).with_for_update()
        res = await session.execute(stmt)
        auction = res.scalars().first()
        if not auction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
        if auction.status != AuctionStatusEnum.ONGOING.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Auction is not active")

        current_high = auction.current_bid or 0
        if amount < current_high + min_increment:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bid increment too small")

        # Lock team
        stmt = select(Team).where(Team.id == team_id).with_for_update()
        res = await session.execute(stmt)
        team = res.scalars().first()
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

        # Ownership check: team_manager can only bid for their own team
        if current_user and getattr(current_user, "role", "") == "team_manager":
            if team.manager_id != getattr(current_user, "id", None):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not manager of the team")

        # Budget enforcement: team.budget_spent is the TOTAL budget cap (explicit, no defaults)
        budget_cap = team.budget_spent
        if budget_cap is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team budget not configured")

        # Calculate pending commitments in other ongoing/paused auctions
        pending_other = await _sum_pending_bids_other_auctions(session, team_id, auction_id)

        # If team currently winning this auction, their previous bid will be released
        previous_bid_amount = 0
        if auction.current_bidder_id == team_id and auction.current_bid:
            previous_bid_amount = auction.current_bid

        # Required extra commitment = new_amount - old_amount_on_this_auction
        required_delta = amount - previous_bid_amount

        # Available budget after pending commitments in other auctions
        available = budget_cap - pending_other
        if required_delta > available:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient budget")

        # Unset previous winning bid for this auction
        stmt = select(Bid).where(Bid.auction_id == auction_id, Bid.is_winning == True).with_for_update()
        res = await session.execute(stmt)
        prev_bid = res.scalars().first()
        if prev_bid:
            prev_bid.is_winning = False
            session.add(prev_bid)

        # Insert new bid
        bid = Bid(
            id=str(uuid4()),
            auction_id=auction_id,
            player_id=auction.current_player_id,
            team_id=team_id,
            amount=amount,
            is_winning=True,
        )
        session.add(bid)

        # Update auction
        auction.current_bid = amount
        auction.current_bidder_id = team_id
        session.add(auction)

    # transaction committed here
    await session.refresh(bid)

    # Broadcast after successful commit
    payload = {
        "type": "bid_placed",
        "auction_id": auction_id,
        "current_bid": bid.amount,
        "team_id": bid.team_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_room(f"auction:{auction_id}", payload)

    return bid


async def end_auction(session: AsyncSession, auction_id: str, force: bool = False) -> Auction:
    async with session.begin():
        stmt = select(Auction).where(Auction.id == auction_id).with_for_update()
        res = await session.execute(stmt)
        auction = res.scalars().first()
        if not auction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
        # Determine winning bid
        stmt = select(Bid).where(Bid.auction_id == auction_id, Bid.is_winning == True).with_for_update()
        res = await session.execute(stmt)
        winning = res.scalars().first()
        if not winning and not force:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No winning bid to sell")

        if winning:
            # transfer player to team and update finances
            stmt = select(Player).where(Player.id == auction.current_player_id).with_for_update()
            res = await session.execute(stmt)
            player = res.scalars().first()
            if player:
                player.team_id = winning.team_id
                player.sold_price = winning.amount
                player.status = "sold"
                session.add(player)

            # update team budget_spent
            stmt = select(Team).where(Team.id == winning.team_id).with_for_update()
            res = await session.execute(stmt)
            team = res.scalars().first()
            if team:
                team.budget_spent = (team.budget_spent or 0) + winning.amount
                session.add(team)

            auction.total_revenue = (auction.total_revenue or 0) + (winning.amount or 0)

        auction.status = AuctionStatusEnum.COMPLETED.value
        auction.ended_at = datetime.utcnow()
        session.add(auction)

    await session.refresh(auction)

    # Broadcast after successful commit
    payload = {
        "type": "auction_ended",
        "auction_id": auction.id,
        "status": auction.status,
        "winner_team_id": auction.current_bidder_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_room(f"auction:{auction_id}", payload)

    return auction


async def cancel_auction(session: AsyncSession, auction_id: str) -> Auction:
    async with session.begin():
        stmt = select(Auction).where(Auction.id == auction_id).with_for_update()
        res = await session.execute(stmt)
        auction = res.scalars().first()
        if not auction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")

        # clear winning bids
        stmt = select(Bid).where(Bid.auction_id == auction_id, Bid.is_winning == True).with_for_update()
        res = await session.execute(stmt)
        bids = res.scalars().all()
        for b in bids:
            b.is_winning = False
            session.add(b)

        auction.status = AuctionStatusEnum.PAUSED.value
        auction.current_bid = None
        auction.current_bidder_id = None
        session.add(auction)

    await session.refresh(auction)

    # Broadcast after successful commit
    payload = {
        "type": "auction_cancelled",
        "auction_id": auction.id,
        "status": auction.status,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_room(f"auction:{auction_id}", payload)

    return auction
