import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))

from shared_utils import get_db

def check_duplicates():
    db = get_db()
    col = db["projects"]
    
    print("Checking for duplicate rows in projects collection...")
    
    # We check for duplicate 'order_num' (excluding empty ones)
    pipeline = [
        {"$group": {
            "_id": "$order_num", 
            "count": {"$sum": 1},
            "docs": {"$push": "$_id"},
            "platforms": {"$push": "$profile"}
        }},
        {"$match": {
            "count": {"$gt": 1},
            "_id": {"$ne": None},
            "_id": {"$ne": ""}
        }}
    ]
    
    duplicates = list(col.aggregate(pipeline))
    
    if len(duplicates) == 0:
        print("OK: No duplicate 'order_num' found in projects collection.")
    else:
        print(f"ERROR: Found {len(duplicates)} order_num with multiple entries:")
        for dup in duplicates[:10]:
            print(f"   Order ID: {dup['_id']} - Count: {dup['count']} - Platforms: {dup['platforms']}")
        if len(duplicates) > 10:
            print(f"   ... and {len(duplicates) - 10} more.")
            
    # Total documents
    total = col.count_documents({})
    print(f"\nTotal documents in DB: {total}")
    
if __name__ == "__main__":
    check_duplicates()
