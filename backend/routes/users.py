from fastapi import APIRouter, Body, HTTPException
from core.database import users_collection
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/signup")
async def signup(user_data: dict = Body(...)):
    try:
        if users_collection.find_one({"email": user_data["email"]}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        result = users_collection.insert_one(user_data)
        return {
            "status": "success", 
            "db_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{db_id}/add-friend")
async def add_friend(db_id: str, friend: dict = Body(..., embed=True)):
    try:
        # 1. Fetch the REAL user details of the friend to REVEAL identity
        if "id" in friend:
            friend_doc = users_collection.find_one({"_id": ObjectId(friend["id"])})
            if friend_doc:
                real_first = friend_doc.get("firstName", "")
                real_last = friend_doc.get("lastName", "")
                full_name = f"{real_first} {real_last}".strip()
                
                # Update the friend object with real details
                friend["alias"] = full_name
                friend["name"] = full_name
                friend["firstName"] = real_first
                friend["lastName"] = real_last
                
                # Remove "Anonymous" artifacts slightly if needed, but keeping ID/Bio is fine
        
        # 2. Update the user document by pushing the REVEALED friend to inner_circle
        result = users_collection.update_one(
            {"_id": ObjectId(db_id)},
            {"$push": {"inner_circle": friend}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"status": "success", "message": "Friend added and identity revealed", "friend": friend}
    except Exception as e:
        print(f"Add Friend Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))