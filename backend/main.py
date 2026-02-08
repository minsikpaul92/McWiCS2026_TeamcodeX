from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import matching, auth

app = FastAPI(title="IntroConnect API")

# Register Routers
app.include_router(matching.router)
app.include_router(auth.router)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to IntroConnect API - Running on Gemini"}

@app.get("/health")
async def health():
    return {"status": "healthy"}