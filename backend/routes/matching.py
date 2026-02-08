from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
from bson import ObjectId
from core.database import users_collection
from engine.analyzer import analyze_user_data
from engine.matcher import calculate_match_score
from engine.interviewer import generate_next_question

router = APIRouter(prefix="/matching", tags=["matching"])

@router.get("/list/{db_id}")
async def list_matches(db_id: str):
    """
    Fetches all completed users, calculates scores against the requester, and returns a sorted list.
    """
    try:
        # 1. Fetch current user
        current_user = users_collection.find_one({"_id": ObjectId(db_id)})
        if not current_user or "analyzed_profile" not in current_user:
            return [] # No profile to match against yet

        current_profile = current_user["analyzed_profile"]

        # 2. Fetch all other COMPLETED users
        other_users = users_collection.find({
            "_id": {"$ne": ObjectId(db_id)},
            "onboarding_status": "completed",
            "analyzed_profile": {"$exists": True}
        })

        results = []
        for i, other in enumerate(other_users):
            other_profile = other["analyzed_profile"]
            
            # Use engine/matcher.py to calculate score
            score, reasons = calculate_match_score(current_profile, other_profile)
            
            # --- PHASE 10 REFINEMENT ---
            # 1. 70% Threshold
            if score < 70:
                continue
                
            # 2. Anonymize Name (Anonymous 1, 2, 3...)
            # We use 1-based indexing for users
            anon_name = f"Anonymous {len(results) + 1}"
            
            # Format according to frontend expectations in matches/page.tsx
            results.append({
                "id": str(other["_id"]),
                "name": anon_name,
                "bio": other_profile.get("user_profile", {}).get("summary", "A mysterious kindred spirit."),
                "interests": other_profile.get("user_profile", {}).get("tags", {}).get("likes", []),
                "match_score": score
            })

        # 3. Sort by score descending
        results = sorted(results, key=lambda x: x["match_score"], reverse=True)
        
        return results[:10] # Return top 10 matches
    except Exception as e:
        print(f"Matching List Error: {e}")
        return [] # Return empty list on failure to prevent frontend crashes
