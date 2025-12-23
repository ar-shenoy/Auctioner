from __future__ import annotations

import json
from typing import Optional
from uuid import uuid4
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import HTTPException, status

from app.models import Match, MatchEvent, PlayerMatchStats, PlayerCareerStats, Player, Team
from app.models.enums import MatchStatusEnum, EventTypeEnum
from app.websocket.manager import manager


async def create_match(
    session: AsyncSession,
    name: str,
    match_type: str,
    team_1_id: str,
    team_2_id: str,
    scheduled_at: datetime,
) -> Match:
    """Create a new match in SCHEDULED status."""
    if team_1_id == team_2_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teams must be different")

    match = Match(
        id=str(uuid4()),
        name=name,
        match_type=match_type,
        status=MatchStatusEnum.SCHEDULED.value,
        team_1_id=team_1_id,
        team_2_id=team_2_id,
        scheduled_at=scheduled_at,
        team_1_score=0,
        team_2_score=0,
    )
    session.add(match)
    await session.commit()
    await session.refresh(match)
    return match


async def start_match(session: AsyncSession, match_id: str) -> Match:
    """Start a match, transitioning to ONGOING status."""
    async with session.begin():
        stmt = select(Match).where(Match.id == match_id).with_for_update()
        res = await session.execute(stmt)
        match = res.scalars().first()
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        if match.status != MatchStatusEnum.SCHEDULED.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only scheduled matches can be started")

        match.status = MatchStatusEnum.ONGOING.value
        match.started_at = datetime.utcnow()
        session.add(match)

    await session.refresh(match)

    # Broadcast after successful commit
    payload = {
        "type": "match_started",
        "match_id": match.id,
        "status": match.status,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_room(f"match:{match_id}", payload)

    return match


async def _get_next_sequence_number(session: AsyncSession, match_id: str) -> int:
    """Get the next sequence number for a match event."""
    stmt = select(func.coalesce(func.max(MatchEvent.sequence_number), 0)).where(MatchEvent.match_id == match_id)
    res = await session.execute(stmt)
    max_seq = res.scalar() or 0
    return max_seq + 1


async def _parse_event_data(event_data: Optional[str]) -> dict:
    """Parse JSON event_data safely."""
    if not event_data:
        return {}
    try:
        return json.loads(event_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON in event_data")


async def _recalculate_player_stats(session: AsyncSession, player_id: str, match_id: str) -> None:
    """Recalculate player_match_stats by replaying relevant events."""
    # For now, simple placeholder: stat updates would be driven by event_data parsing
    # In production, parse all events for the match and accumulate stats per player
    pass


async def _recalculate_career_stats(session: AsyncSession, player_id: str) -> None:
    """Recalculate player_career_stats by summing all match stats."""
    async with session.begin():
        # Sum all PlayerMatchStats for this player
        stmt = select(
            func.count(PlayerMatchStats.id).label("total_matches"),
            func.coalesce(func.sum(PlayerMatchStats.runs_scored), 0).label("total_runs"),
            func.coalesce(func.sum(PlayerMatchStats.balls_faced), 0).label("total_balls_faced"),
            func.coalesce(func.sum(PlayerMatchStats.fours), 0).label("total_fours"),
            func.coalesce(func.sum(PlayerMatchStats.sixes), 0).label("total_sixes"),
            func.coalesce(func.sum(PlayerMatchStats.wickets_taken), 0).label("total_wickets"),
            func.coalesce(func.sum(PlayerMatchStats.runs_conceded), 0).label("total_runs_conceded"),
            func.coalesce(func.sum(PlayerMatchStats.balls_bowled), 0).label("total_balls_bowled"),
        ).where(PlayerMatchStats.player_id == player_id)

        res = await session.execute(stmt)
        row = res.first()

        total_matches = row.total_matches or 0
        total_runs = int(row.total_runs or 0)
        total_balls = int(row.total_balls_faced or 0)
        total_fours = int(row.total_fours or 0)
        total_sixes = int(row.total_sixes or 0)
        total_wickets = int(row.total_wickets or 0)
        total_runs_conc = int(row.total_runs_conceded or 0)
        total_balls_bowled = int(row.total_balls_bowled or 0)

        # Compute derived metrics
        strike_rate = None
        if total_balls > 0:
            strike_rate = int((total_runs * 100) / total_balls)
        average = None
        if total_wickets > 0:
            average = int((total_runs / total_wickets) * 100)

        # Update or create career stats
        stmt = select(PlayerCareerStats).where(PlayerCareerStats.player_id == player_id).with_for_update()
        res = await session.execute(stmt)
        career = res.scalars().first()

        if career:
            career.total_matches = total_matches
            career.total_runs = total_runs
            career.total_balls_faced = total_balls
            career.total_fours = total_fours
            career.total_sixes = total_sixes
            career.total_wickets = total_wickets
            career.total_runs_conceded = total_runs_conc
            career.total_balls_bowled = total_balls_bowled
            career.strike_rate = strike_rate
            career.average = average
            session.add(career)
        else:
            career = PlayerCareerStats(
                id=str(uuid4()),
                player_id=player_id,
                total_matches=total_matches,
                total_runs=total_runs,
                total_balls_faced=total_balls,
                total_fours=total_fours,
                total_sixes=total_sixes,
                total_wickets=total_wickets,
                total_runs_conceded=total_runs_conc,
                total_balls_bowled=total_balls_bowled,
                strike_rate=strike_rate,
                average=average,
            )
            session.add(career)


async def record_event(session: AsyncSession, match_id: str, event_type: str, event_data: Optional[str]) -> MatchEvent:
    """Record an event atomically, appending to match_events.

    All writes must be atomic: lock match, validate, append event, recalculate stats.
    """
    # Parse and validate event_data
    data = await _parse_event_data(event_data)

    async with session.begin():
        # Lock match row
        stmt = select(Match).where(Match.id == match_id).with_for_update()
        res = await session.execute(stmt)
        match = res.scalars().first()
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        if match.status != MatchStatusEnum.ONGOING.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Match is not ongoing")

        # Get next sequence number
        seq = await _get_next_sequence_number(session, match_id)

        # Create and insert event
        event = MatchEvent(
            id=str(uuid4()),
            match_id=match_id,
            event_type=event_type,
            sequence_number=seq,
            event_data=event_data,
        )
        session.add(event)

        # Recalculate stats if event contains player data
        if "player_id" in data:
            player_id = data.get("player_id")
            await _recalculate_player_stats(session, player_id, match_id)
            await _recalculate_career_stats(session, player_id)

    await session.refresh(event)

    # Broadcast after successful commit
    payload = {
        "type": "event_recorded",
        "match_id": event.match_id,
        "sequence_number": event.sequence_number,
        "event_type": event.event_type,
        "event_data": event.event_data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_room(f"match:{match_id}", payload)

    return event


async def end_match(session: AsyncSession, match_id: str, winner_team_id: Optional[str] = None) -> Match:
    """End a match, transitioning to COMPLETED status."""
    async with session.begin():
        stmt = select(Match).where(Match.id == match_id).with_for_update()
        res = await session.execute(stmt)
        match = res.scalars().first()
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        if match.status != MatchStatusEnum.ONGOING.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only ongoing matches can be ended")

        match.status = MatchStatusEnum.COMPLETED.value
        match.ended_at = datetime.utcnow()
        if winner_team_id:
            match.winner_team_id = winner_team_id
        session.add(match)

    await session.refresh(match)

    # Broadcast after successful commit
    payload = {
        "type": "match_ended",
        "match_id": match.id,
        "status": match.status,
        "winner_team_id": match.winner_team_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_room(f"match:{match_id}", payload)

    return match


async def correct_event(session: AsyncSession, match_id: str, event_id: str, new_event_data: Optional[str]) -> MatchEvent:
    """Record a correction event (admin-only).

    Per event sourcing: corrections are NEW events, not updates to existing events.
    """
    # Parse new event data
    data = await _parse_event_data(new_event_data)

    async with session.begin():
        # Lock match row
        stmt = select(Match).where(Match.id == match_id).with_for_update()
        res = await session.execute(stmt)
        match = res.scalars().first()
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

        # Verify event exists (but don't lock it; corrections are immutable)
        stmt = select(MatchEvent).where(MatchEvent.id == event_id, MatchEvent.match_id == match_id)
        res = await session.execute(stmt)
        orig_event = res.scalars().first()
        if not orig_event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        # Get next sequence number
        seq = await _get_next_sequence_number(session, match_id)

        # Record a new "correction" event
        correction = MatchEvent(
            id=str(uuid4()),
            match_id=match_id,
            event_type="correction",  # Special event type
            sequence_number=seq,
            event_data=json.dumps({"corrects_event_id": event_id, "correction": data}),
        )
        session.add(correction)

        # Recalculate stats if correction involves a player
        if "player_id" in data:
            player_id = data.get("player_id")
            await _recalculate_player_stats(session, player_id, match_id)
            await _recalculate_career_stats(session, player_id)

    await session.refresh(correction)

    # Broadcast after successful commit
    payload = {
        "type": "event_corrected",
        "match_id": correction.match_id,
        "sequence_number": correction.sequence_number,
        "event_data": correction.event_data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast_to_room(f"match:{match_id}", payload)

    return correction
