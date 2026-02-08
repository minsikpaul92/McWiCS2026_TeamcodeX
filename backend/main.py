from fastapi import FastAPI, Body, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os

# 모든 라우터 임포트
from routes import matching, auth, users, chat

app = FastAPI(title="IntroConnect API")

# 1. CORS 설정 (앱 초기화 직후 배치)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. MONGODB 연결 (나중에 .env로 옮기기)
MONGO_URI = "mongodb+srv://zacdanny2007_db_user:uswF8H7rZFi0pbin@mcwics2026db.llmniuq.mongodb.net/?appName=mcwics2026db"
client = MongoClient(MONGO_URI, tlsAllowInvalidCertificates=True)
db = client["IntroConnect"]
users_collection = db["users"]

# 3. 모든 모듈형 라우터 등록
app.include_router(matching.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chat.router)

# --- 공통 엔드포인트 ---

@app.get("/")
async def root():
    return {
        "message": "Welcome to IntroConnect API - Running on Gemini",
        "status": "Fully Modular and Active"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

# --- LOGIN & SIGNUP (임시 통합 로직) ---

@app.post("/login")
async def login(credentials: dict = Body(...)):
    email = credentials.get("email")
    password = credentials.get("password")

    user = users_collection.find_one({"email": email})

    if user and user.get("password") == password:
        return {
            "status": "success",
            "message": "Login successful",
            "user": {
                "email": user.get("email"),
                "firstName": user.get("firstName", "User"),
                "id": str(user["_id"])
            }
        }
    
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/signup")
async def signup(user_data: dict = Body(...)):
    try:
        if users_collection.find_one({"email": user_data["email"]}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        result = users_collection.insert_one(user_data)
        
        return {
            "status": "success", 
            "message": "User saved to Montreal Cloud",
            "db_id": str(result.inserted_id)
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))