import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))

from shared_utils import get_db

def update_config():
    db = get_db()
    col = db["config"]
    
    new_config = {
        "dept_target": 36000,
        "team_targets": {
            "GEO Rankers": 6000,
            "Rank Riser": 12000,
            "Search Apex": 9000,
            "SMM": 9000
        }
    }
    
    col.update_one({"_id": "app_settings"}, {"$set": new_config}, upsert=True)
    print("✅ Configuration updated in MongoDB!")
    
if __name__ == "__main__":
    update_config()
