from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.ai.websocket_manager import connect, disconnect

router = APIRouter(
    tags=["WebSocket"]
)


@router.websocket("/ws/proctor")
async def websocket_endpoint(websocket: WebSocket):

    await connect(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        disconnect(websocket)


@router.get("/ws/test")
def websocket_test():
    return {
        "message": "WebSocket Router Working"
    }