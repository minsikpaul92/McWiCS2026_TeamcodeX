# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# app = FastAPI(title="IntroConnect API")

# # CORS configuration for frontend integration
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.get("/")
# async def root():
#     return {"message": "Welcome to IntroConnect API - Running on Gemini"}

# @app.get("/health")
# async def health():
#     return {"status": "healthy"}

from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os

app = FastAPI(title="IntroConnect API")

# 1. CORS Configuration (Allows your React localhost:3000 to talk to this)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. MONGODB CONNECTION
# Replace <password> with your actual Montreal Cluster password
MONGO_URI = "mongodb+srv://zacdanny2007_db_user:uswF8H7rZFi0pbin@mcwics2026db.llmniuq.mongodb.net/?appName=mcwics2026db"
client = MongoClient(MONGO_URI)
db = client["IntroConnect"]
users_collection = db["users"]

@app.get("/")
async def root():
    return {"message": "Welcome to IntroConnect API - Running on Gemini"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# 3. THE SIGNUP POST ROUTE
@app.post("/signup")
async def signup(user_data: dict = Body(...)):
    try:
        # Check if user already exists by email
        if users_collection.find_one({"email": user_data["email"]}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Insert the JSON from React into MongoDB
        result = users_collection.insert_one(user_data)
        
        return {
            "status": "success", 
            "message": "User saved to Montreal Cloud",
            "db_id": str(result.inserted_id)
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))