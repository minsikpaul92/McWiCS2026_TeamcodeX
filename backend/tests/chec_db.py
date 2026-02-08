from pymongo import MongoClient

uri = "mongodb+srv://zacdanny2007_db_user:uswF8H7rZFi0pbin@mcwics2026db.llmniuq.mongodb.net/?appName=mcwics2026db"
client = MongoClient(uri)

try:
    client.admin.command('ping')
    print("✅ Database connection successful!")
except Exception as e:
    print(f"❌ Connection failed: {e}")