import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Securely load from .env
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not found in environment variables")

client = MongoClient(MONGO_URI, tlsAllowInvalidCertificates=True)
db = client["IntroConnect"]

# Standardized collections across the project
users_collection = db["users"]
conversations_collection = db["conversations"]

def get_db():
    return db

def get_users_collection():
    return users_collection

def get_conversations_collection():
    return conversations_collection
