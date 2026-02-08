from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["auth"])

class UserSignup(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
async def signup(user: UserSignup):
    """
    Simple signup placeholder. In a real app, this would save to a database.
    """
    return {"message": "User created successfully", "user_id": "user_" + user.username}

@router.post("/login")
async def login(user: UserLogin):
    """
    Simple login placeholder.
    """
    # Dummy check
    if user.email == "test@example.com" and user.password == "password":
        return {
            "access_token": "fake-jwt-token",
            "token_type": "bearer"
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")
