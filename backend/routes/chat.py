from fastapi import APIRouter, Body, HTTPException
from core.database import conversations_collection

router = APIRouter(prefix="/chat", tags=["chat"])

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