from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from core.database import users_collection
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["auth"])

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
async def login(user: UserLogin):
    """
    Verify credentials against MongoDB.
    """
    db_user = users_collection.find_one({"email": user.email})
    
    if db_user and db_user.get("password") == user.password:
        return {
            "status": "success",
            "user": {
                "id": str(db_user["_id"]),
                "firstName": db_user.get("firstName", "Explorer"),
                "email": db_user.get("email")
            }
        }
        
    raise HTTPException(status_code=401, detail="Invalid email or password")
