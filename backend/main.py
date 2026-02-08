from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import matching, auth, users, chat, onboarding
from core.database import users_collection

app = FastAPI(title="IntroConnect API")

# 1. CORS Configuration (include 127.0.0.1 and network IP for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.21.80.1:3000",
        "https://mc-wi-cs-2026-teamcode-9kltmmx0v-minsikpaul92s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Register Modular Routers
app.include_router(matching.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chat.router)
app.include_router(onboarding.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to IntroConnect API - Standardized & Modular",
        "status": "Active"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
