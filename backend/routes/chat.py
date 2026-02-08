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