from fastapi import APIRouter, Body, HTTPException
from bson import ObjectId
import json
from core.database import users_collection, conversations_collection
from engine.interviewer import generate_next_question
from engine.analyzer import analyze_user_data

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

@router.post("/start/{db_id}")
async def start_onboarding(db_id: str, data: dict = Body(...)):
    """
    Saves initial likes/dislikes/intro to the user profile and prepares for AI interview.
    """
    try:
        # Save initial info to the user document
        users_collection.update_one(
            {"_id": ObjectId(db_id)},
            {"$set": {
                "initial_onboarding": data,
                "onboarding_status": "in_progress"
            }}
        )
        
        # Initialize or reset a conversation session
        conversations_collection.update_one(
            {"user_id": db_id},
            {"$set": {"history": [], "initial_data": data}},
            upsert=True
        )
        
        return {"status": "success", "message": "Onboarding session started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start onboarding: {str(e)}")

@router.post("/chat/{db_id}")
async def fetch_next_ai_question(db_id: str, user_answer: str = Body(None, embed=True)):
    """
    Receives user answer, updates history in DB, and gets next question from Gemini AI.
    Merges signup profile data with initial onboarding data for better context.
    """
    try:
        # 1. Fetch current session and user profile
        session = conversations_collection.find_one({"user_id": db_id})
        user = users_collection.find_one({"_id": ObjectId(db_id)})
        
        if not session or not user:
            raise HTTPException(status_code=404, detail="Session or User not found")
        
        history = session.get("history", [])
        
        # Merge Signup Data + Onboarding Answers
        initial_data = session.get("initial_data", {})
        initial_data.update({
            "firstName": user.get("firstName"),
            "lastName": user.get("lastName"),
            "gender": user.get("gender"),
            "age": user.get("age"),
            "email": user.get("email")
        })
        
        # 2. Append user's last answer to history (if provided)
        if user_answer and user_answer.strip():
            history.append({"role": "user", "content": user_answer})
        
        # 3. Call AI Interviewer Engine
        ai_response_json = await generate_next_question(initial_data, history)
        ai_res = json.loads(ai_response_json)
        
        # 4. Append AI's next question/closing to history
        history.append({"role": "ai", "content": ai_res["next_question"]})
        
        # 5. Update DB session
        conversations_collection.update_one(
            {"user_id": db_id},
            {"$set": {"history": history}}
        )
        
        return ai_res
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/complete/{db_id}")
async def complete_onboarding(db_id: str):
    """
    Finalizes the onboarding by running the AI analyzer and saving the profile.
    """
    try:
        session = conversations_collection.find_one({"user_id": db_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        history = session.get("history", [])
        initial_data = session.get("initial_data", {})
        
        # Prepare for analysis
        final_content = f"Initial Info: {json.dumps(initial_data)}\nConversation: {json.dumps(history)}"
        
        # Run AI Analyzer Engine
        analysis_json = await analyze_user_data(None, final_content)
        profile_data = json.loads(analysis_json)
        
        # Save structured profile to the permanent user record
        users_collection.update_one(
            {"_id": ObjectId(db_id)},
            {"$set": {
                "analyzed_profile": profile_data,
                "onboarding_status": "completed"
            }}
        )
        
        return {"status": "success", "profile": profile_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
