"""WebSocket endpoints for real-time updates.

Authenticated, read-only connections for auction and match events.
"""

from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_session
from app.models import Auction
from app.websocket.manager import manager


async def _get_current_user_from_token(token: str):
    """Decode and validate JWT token, return user_id if valid."""
    try:
        payload = decode_token(token, expected_type="access")
        return payload.get("sub")
    except Exception:
        return None


async def websocket_auction_endpoint(websocket: WebSocket, auction_id: str, token: str) -> None:
    """WebSocket endpoint for auction updates.
    
    Requires JWT token as query parameter. Sends auction snapshots and event updates.
    """
    # Authenticate
    user_id = await _get_current_user_from_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return

    room = f"auction:{auction_id}"
    
    try:
        await manager.connect(room, websocket)

        # Send initial snapshot of auction
        async with AsyncSession(bind=None) as session:
            # Get the auction to send initial state
            stmt = select(Auction).where(Auction.id == auction_id)
            result = await session.execute(stmt)
            auction = result.scalars().first()

            if auction:
                snapshot = {
                    "type": "snapshot",
                    "auction_id": auction.id,
                    "status": auction.status,
                    "current_bid": auction.current_bid,
                    "current_bidder_id": auction.current_bidder_id,
                    "total_revenue": auction.total_revenue,
                    "timestamp": datetime.utcnow().isoformat(),
                }
                await websocket.send_json(snapshot)

        # Keep connection open; messages are ignored (read-only)
        while True:
            # Receive but ignore any incoming messages
            await websocket.receive_text()

    except WebSocketDisconnect:
        await manager.disconnect(room, websocket)
    except Exception as e:
        await manager.disconnect(room, websocket)
        await websocket.close(code=status.WS_1011_SERVER_ERROR)


