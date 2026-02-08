from fastapi import APIRouter, Body, HTTPException, WebSocket, WebSocketDisconnect
from datetime import datetime
from typing import Dict, List
from core.database import conversations_collection, messages_collection

router = APIRouter(prefix="/chat", tags=["chat"])


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.connections:
            self.connections[user_id] = []
        self.connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.connections:
            self.connections[user_id] = [ws for ws in self.connections[user_id] if ws != websocket]
            if not self.connections[user_id]:
                del self.connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.connections:
            dead = []
            for ws in self.connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.connections[user_id].remove(ws)


manager = ConnectionManager()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


@router.post("/send")
async def send_message(payload: dict = Body(...)):
    """Insert a message into MongoDB. Format: senderId, receiverId, content, timestamp."""
    try:
        sender_id = payload.get("senderId")
        receiver_id = payload.get("receiverId")
        content = payload.get("content")
        if not sender_id or not receiver_id or not content:
            raise HTTPException(status_code=400, detail="senderId, receiverId, and content are required")

        doc = {
            "senderId": sender_id,
            "receiverId": receiver_id,
            "content": content.strip(),
            "timestamp": datetime.utcnow()
        }
        result = messages_collection.insert_one(doc)
        saved_msg = {
            "_id": str(result.inserted_id),
            "senderId": sender_id,
            "receiverId": receiver_id,
            "content": doc["content"],
            "timestamp": doc["timestamp"].isoformat()
        }
        await manager.send_to_user(receiver_id, {"type": "new_message", "message": saved_msg})
        return saved_msg
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    """Get all conversation partners for a user (people they've exchanged messages with)."""
    try:
        pipeline = [
            {"$match": {"$or": [{"senderId": user_id}, {"receiverId": user_id}]}},
            {"$sort": {"timestamp": -1}},
            {
                "$group": {
                    "_id": None,
                    "partners": {
                        "$push": {
                            "partnerId": {"$cond": [{"$eq": ["$senderId", user_id]}, "$receiverId", "$senderId"]},
                            "lastMessage": "$content",
                            "lastTimestamp": "$timestamp"
                        }
                    }
                }
            },
            {"$unwind": "$partners"},
            {
                "$group": {
                    "_id": "$partners.partnerId",
                    "lastMessage": {"$first": "$partners.lastMessage"},
                    "lastTimestamp": {"$first": "$partners.lastTimestamp"}
                }
            },
            {"$sort": {"lastTimestamp": -1}},
            {
                "$project": {
                    "partnerId": "$_id",
                    "lastMessage": 1,
                    "lastTimestamp": 1,
                    "_id": 0
                }
            }
        ]
        results = list(messages_collection.aggregate(pipeline))
        return {"conversations": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/has-messages/{user_id}")
async def check_user_has_messages(user_id: str):
    """Check if a user has any messages (sent or received) in MongoDB."""
    try:
        count = messages_collection.count_documents({
            "$or": [
                {"senderId": user_id},
                {"receiverId": user_id}
            ]
        })
        return {
            "hasMessages": count > 0,
            "count": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{sender_id}/{receiver_id}")
async def get_conversation(sender_id: str, receiver_id: str):
    """Fetch messages between two users (bidirectional)."""
    try:
        cursor = messages_collection.find({
            "$or": [
                {"senderId": sender_id, "receiverId": receiver_id},
                {"senderId": receiver_id, "receiverId": sender_id}
            ]
        }).sort("timestamp", 1)
        messages = []
        for msg in cursor:
            messages.append({
                "_id": str(msg["_id"]),
                "senderId": msg["senderId"],
                "receiverId": msg["receiverId"],
                "content": msg["content"],
                "timestamp": msg["timestamp"].isoformat() if hasattr(msg["timestamp"], "isoformat") else str(msg["timestamp"])
            })
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/save/{db_id}")
async def save_chat(db_id: str, message: dict = Body(...)):
    try:
        result = conversations_collection.update_one(
            {"user_id": db_id},
            {"$push": {"history": message}},
            upsert=True
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{db_id}")
async def get_chat_history(db_id: str):
    try:
        session = conversations_collection.find_one({"user_id": db_id})
        if not session:
            return {"history": []}
        
        # Format for frontend (mostly ensuring things are JSON serializable)
        history = session.get("history", [])
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))