import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))

from shared_utils import get_db
import sync_mongo

def reset_and_sync():
    db = get_db()
    
    # 1. Clear old duplicated projects
    print("Clearing old duplicate projects from MongoDB...")
    db["projects"].delete_many({})
    
    # 2. Run sync to fetch fresh data with new stable IDs
    print("Running full sync to insert fresh data with stable IDs...")
    sync_mongo.sync()
    
    # 3. Check document count
    total = db["projects"].count_documents({})
    print(f"✅ Sync complete! Total unique projects now in DB: {total}")

if __name__ == "__main__":
    reset_and_sync()
