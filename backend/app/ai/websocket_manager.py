from fastapi import WebSocket

active_connections = []


async def connect(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)


def disconnect(websocket: WebSocket):
    if websocket in active_connections:
        active_connections.remove(websocket)


async def broadcast(message: dict):
    disconnected = []

    for connection in active_connections:
        try:
            await connection.send_json(message)
        except Exception:
            disconnected.append(connection)

    for connection in disconnected:
        disconnect(connection)