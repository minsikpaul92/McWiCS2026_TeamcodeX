from fastapi import APIRouter, Body, HTTPException
from core.database import users_collection

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/signup")
async def signup(user_data: dict = Body(...)):
    try:
        if users_collection.find_one({"email": user_data["email"]}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        result = users_collection.insert_one(user_data)
        return {
            "status": "success", 
            "db_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))