"""WebSocket connection manager for real-time updates.

Tracks active connections, groups by room, broadcasts events.
"""

from typing import Dict, Set
from fastapi import WebSocket
import json


class ConnectionManager:
    """Manages WebSocket connections grouped by rooms.
    
    Rooms are identified as:
    - auction:{auction_id}
    - match:{match_id}
    
    Thread-safe for concurrent connections.
    """

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, room: str, websocket: WebSocket) -> None:
        """Add a connection to a room."""
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = set()
        self.active_connections[room].add(websocket)

    async def disconnect(self, room: str, websocket: WebSocket) -> None:
        """Remove a connection from a room and clean up empty rooms."""
        if room in self.active_connections:
            self.active_connections[room].discard(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]

    async def broadcast_to_room(self, room: str, message: dict) -> None:
        """Broadcast a message to all connections in a room.
        
        Args:
            room: Room identifier (e.g., auction:123abc, match:456def)
            message: JSON-serializable dict to broadcast
        """
        if room not in self.active_connections:
            return

        payload = json.dumps(message)
        disconnected = []

        for connection in self.active_connections[room]:
            try:
                await connection.send_text(payload)
            except Exception as e:
                # Connection closed or errored; mark for removal
                disconnected.append(connection)

        # Clean up disconnected connections
        for connection in disconnected:
            await self.disconnect(room, connection)


# Global connection manager instance
manager = ConnectionManager()
