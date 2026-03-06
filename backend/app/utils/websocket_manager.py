from fastapi import WebSocket
from typing import Dict, Any

class ConnectionManager:
    def __init__(self):
        # Maps a string user_id to their active WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict[str, Any], user_id: str):
        """Sends a JSON notification to a specific user if they are online."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)

    async def broadcast(self, message: dict[str, Any]):
        """Sends a JSON notification to EVERYONE online."""
        for connection in self.active_connections.values():
            await connection.send_json(message)

# Create a single global instance to be used across your app
manager = ConnectionManager()