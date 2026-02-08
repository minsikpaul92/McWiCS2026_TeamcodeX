import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()
uri = os.getenv("MONGO_URI")

if not uri:
    print("❌ MONGO_URI not found in .env")
else:
    # Create a new client and connect to the server
    client = MongoClient(uri, server_api=ServerApi('1'), tlsAllowInvalidCertificates=True)

    # Send a ping to confirm a successful connection
    try:
        client.admin.command('ping')
        print("✅ Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")