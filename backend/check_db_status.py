from core.database import users_collection

def check_db():
    user_count = users_collection.count_documents({})
    print(f"\n📊 [DB Status] Current Registered Users: {user_count}")
    
    latest_user = users_collection.find_one(sort=[("_id", -1)])
    if latest_user:
        print(f"✨ Latest User: {latest_user.get('email')} ({latest_user.get('firstName')})")
    else:
        print("📭 No users found in the database.")

if __name__ == "__main__":
    check_db()
