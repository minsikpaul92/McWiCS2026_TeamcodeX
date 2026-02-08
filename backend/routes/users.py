from fastapi import APIRouter, Body, HTTPException
from core.database import users_collection
from bson import ObjectId
from routes.chat import manager as ws_manager

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

@router.post("/search-by-email")
async def search_by_email(payload: dict = Body(...)):
    """Look up a user by email. Returns id, firstName, lastName for display. Caller can then chat or add to inner circle."""
    try:
        email = (payload.get("email") or "").strip().lower()
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        requester_id = payload.get("user_id")  # optional, to exclude self
        found = users_collection.find_one({"email": email})
        if not found:
            raise HTTPException(status_code=404, detail="No user found with this email")
        fid = str(found["_id"])
        if requester_id and fid == requester_id:
            raise HTTPException(status_code=400, detail="That's your own email")
        first = found.get("firstName", "")
        last = found.get("lastName", "")
        return {
            "id": fid,
            "firstName": first,
            "lastName": last,
            "name": f"{first} {last}".strip() or "Anonymous",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{db_id}/add-friend")
async def add_friend(db_id: str, friend: dict = Body(..., embed=True)):
    try:
        # Store as Anonymous until mutual match (both add each other)
        friend_to_store = {**friend, "alias": "Anonymous", "name": "Anonymous"}
        if "id" not in friend_to_store:
            friend_to_store["id"] = friend.get("id")

        result = users_collection.update_one(
            {"_id": ObjectId(db_id)},
            {"$push": {"inner_circle": friend_to_store}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        is_match = False
        friend_id = str(friend.get("id") or friend_to_store.get("id", ""))
        if friend_id:
            other_user = users_collection.find_one({"_id": ObjectId(friend_id)})
            if other_user:
                their_inner = {str(f.get("id")) for f in other_user.get("inner_circle", []) if f.get("id")}
                if db_id in their_inner:
                    is_match = True
                    await ws_manager.send_to_user(friend_id, {"type": "match_update"})

        return {"status": "success", "message": "Friend added to inner circle", "friend": friend_to_store, "is_match": is_match}
    except Exception as e:
        print(f"Add Friend Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{db_id}/resolve-display-names")
async def resolve_display_names(db_id: str, payload: dict = Body(...)):
    """Return display names for friend ids. Reveal real name only when both users have added each other (match)."""
    friend_ids = payload.get("friend_ids", [])
    if not friend_ids:
        return {}
    result = {}
    current_user = users_collection.find_one({"_id": ObjectId(db_id)})
    if not current_user:
        return result
    my_inner = {f.get("id") for f in current_user.get("inner_circle", []) if f.get("id")}
    for fid in friend_ids:
        if not fid:
            result[fid] = "Anonymous"
            continue
        if fid not in my_inner:
            result[fid] = "Anonymous"
            continue
        other_user = users_collection.find_one({"_id": ObjectId(fid)})
        if not other_user:
            result[fid] = "Anonymous"
            continue
        their_inner = {f.get("id") for f in other_user.get("inner_circle", []) if f.get("id")}
        if db_id in their_inner:
            first = other_user.get("firstName", "")
            last = other_user.get("lastName", "")
            name = f"{first} {last}".strip() or "Anonymous"
            result[fid] = name
        else:
            result[fid] = "Anonymous"
    return result


@router.post("/{db_id}/remove-friend")
async def remove_friend(db_id: str, friend_id: str = Body(..., embed=True)):
    try:
        result = users_collection.update_one(
            {"_id": ObjectId(db_id)},
            {"$pull": {"inner_circle": {"id": friend_id}}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"status": "success", "message": "Friend removed from inner circle"}
    except Exception as e:
        print(f"Remove Friend Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))