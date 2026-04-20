import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "seo_dashboard"

def seed_config():
    client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    db = client[DB_NAME]
    config_col = db["config"]

    settings = {
        "_id": "app_settings",
        "dept_target": 35000, # Updated based on common target in previous conversations
        "member_target": 1100,
        "team_targets": {
            "GEO Rankers": 6000,
            "Rank Riser": 12000,
            "Search Apex": 9000,
            "SMM": 7700,
        },
        "management": {
            "manager": {"name": "Mehedi Hassan", "title": "Project Manager"},
            "leaders": {
                "GEO Rankers": {"name": "Md. Jahidul Islam", "title": "Team Leader"},
                "Rank Riser": {"name": "Gazi Fahim Hasan", "title": "Team Leader"},
                "Search Apex": {"name": "Shihadul Islam Tihim", "title": "Team Leader"},
                "SMM": {"name": "Istiak", "title": "Team Leader"},
            }
        },
        "name_aliases": {
            "istak": "Istiak",
            "istak ahamed": "Istiak",
            "gazi fahim": "Gazi Fahim",
            "istiak ahmed": "Istiak Ahmed",
            "jobaed": "Jobaeid",
            "md. jahidul islam": "Jahidul",
            "ahsanul haque sabbir": "Sabit",
            "md. lavlu hossain": "Robel",
        }
    }

    print(f"Seeding configuration to {DB_NAME}...")
    config_col.update_one({"_id": "app_settings"}, {"$set": settings}, upsert=True)
    print("Configuration seeded successfully.")

if __name__ == "__main__":
    seed_config()
