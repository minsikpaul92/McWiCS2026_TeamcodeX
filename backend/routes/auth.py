from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from core.database import users_collection
from core.security import verify_password
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
    
    print(f"DEBUG: Login attempt for {user.email}")
    if db_user:
        stored_password = db_user.get("password")
        print(f"DEBUG: User found. Stored PW length: {len(str(stored_password))}")
        
        # Check if password matches (securely verify hash)
        try:
            is_valid = verify_password(user.password, stored_password)
            print(f"DEBUG: Password verification result: {is_valid}")
            
            if is_valid:
                print("DEBUG: login success, returning response")
                return {
                    "status": "success",
                    "user": {
                        "id": str(db_user["_id"]),
                        "firstName": db_user.get("firstName", "Explorer"),
                        "email": db_user.get("email"),
                        "inner_circle": db_user.get("inner_circle", [])
                    }
                }
            else:
                print("DEBUG: Password mismatch")
        except Exception as e:
            print(f"DEBUG: Login Verification Error: {e}")
            raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")
        
    raise HTTPException(status_code=401, detail="Invalid email or password")
