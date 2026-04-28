
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv("MONGO_URI")
print(f"Connecting to: {uri[:20]}...")

try:
    client = MongoClient(uri, server_api=ServerApi('1'), serverSelectionTimeoutMS=5000)
    db = client["seo_dashboard"]
    print("Selecting document...")
    doc = db["dept_summary"].find_one({"_id": "current_stats"})
    print(f"Success! Found: {doc['_id'] if doc else 'None'}")
except Exception as e:
    print(f"Error: {e}")
