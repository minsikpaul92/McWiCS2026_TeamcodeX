from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
from engine.analyzer import analyze_user_data
from engine.matcher import calculate_match_score
from engine.interviewer import generate_next_question

router = APIRouter(prefix="/matching", tags=["matching"])

class AssessRequest(BaseModel):
    user_id: str
    new_input: str
    existing_profile: Optional[dict] = None

class OnboardingRequest(BaseModel):
    initial_data: dict
    chat_history: List[dict]

class MatchRequest(BaseModel):
    user1_profile: dict
    user2_profile: dict

@router.post("/assess")
async def assess_user(request: AssessRequest):
    """
    Analyzes user data using AI and returns the structured profile.
    """
    try:
        analysis_result = await analyze_user_data(request.existing_profile, request.new_input)
        return json.loads(analysis_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/next-question")
async def get_next_question(request: OnboardingRequest):
    """
    Generates the next dynamic question for onboarding.
    """
    try:
        response_json = await generate_next_question(request.initial_data, request.chat_history)
        return json.loads(response_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/score")
async def get_match_score(request: MatchRequest):
    """
    Calculates proximity and compatibility score between two profiles.
    """
    try:
        score, reasons = calculate_match_score(request.user1_profile, request.user2_profile)
        return {
            "compatibility_score": score,
            "reasons": reasons
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error calculating score: {str(e)}")
