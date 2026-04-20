import json, urllib.request, re, time, os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo import UpdateOne
import agent_engine
from shared_utils import (
    SHEET_ID, MONGO_URI, DB_NAME, COL,
    get_db, parse_gviz_date, safe_float, fetch_sheet_data_gviz
)

# ─── MAIN SYNC ────────────────────────────────────────
def sync():
    print(f"Starting Sync: {time.ctime()}")
    db = get_db()
    
    # 1. Sync Members
    print("Fetching Members...")
    member_rows = fetch_sheet_data_gviz("All Member Data")
    if member_rows:
        members_collection = db["members"]
        # Skip header if present (header row 0: ID, Full Name, Short Name, etc.)
        valid_members = []
        for r in member_rows:
            if len(r) > 6 and r[2] and r[6]: # Short Name and Team
                valid_members.append({
                    "name": str(r[2]).strip(),
                    "fullName": str(r[1]).strip() if len(r)>1 else str(r[2]),
                    "id": str(r[0]).strip(),
                    "team": str(r[6]).strip(),
                    "updated_at": time.time()
                })
        if valid_members:
            # Simple overwrite for members for now
            members_collection.delete_many({})
            members_collection.insert_many(valid_members)
            print(f"Synced {len(valid_members)} members.")

    # 2. Sync Projects (Kam Data)
    print("Fetching Projects...")
    project_rows = fetch_sheet_data_gviz("Kam Data")
    if project_rows:
        projects_collection = db["projects"]
        projects_collection.delete_many({})  # Clean state to avoid duplicates
        data_rows = project_rows[1:] # Skip header
        
        batch = []
        skipped_count = 0
        for i, r in enumerate(data_rows):
            while len(r) <= max(COL.values()): r.append("")
            
            service = str(r[COL["service"]]).strip().upper()
            if "SEO" not in service and "SMM" not in service:
                skipped_count += 1
                continue
                
            order_num = str(r[COL["order_num"]]).strip()
            del_by = str(r[COL["del_by"]]).strip()
            
            # Create a unique-ish ID to prevent duplicates but allow updates
            # Order Number + Assigned Team/Person context. Adding row index (i) 
            # prevents overwrites of different projects missing order_nums.
            doc_id = f"{order_num}_{del_by}_{i}".replace(" ", "_").strip("_")
            
            doc = {
                "order_num": order_num,
                "order_link": str(r[COL["order_link"]]),
                "client": str(r[COL["client"]]),
                "assign": str(r[COL["assign"]]),
                "status": str(r[COL["status"]]),
                "service": service,
                "del_by": del_by,
                "del_date": str(r[COL["del_date"]]),
                "amount_x": safe_float(r[COL["amount_x"]]),
                "date": str(r[COL["date"]]),
                "updated_at": time.time()
            }
            
            from pymongo import UpdateOne
            batch.append(UpdateOne({"_id": doc_id}, {"$set": doc}, upsert=True))
            
        if batch:
            result = projects_collection.bulk_write(batch)
            print(f"Projects Sync: {result.upserted_count} new, {result.modified_count} updated. (Skipped {skipped_count} non-SEO/SMM rows)")
        else:
            print("No valid projects found to sync.")

    print(f"Sync Complete: {time.ctime()}")
    
    # Trigger Recalculate Summary Tables
    try:
        agent_engine.calculate_summaries()
    except Exception as e:
        print(f"Summary Recalc Error: {e}")

if __name__ == "__main__":
    sync()
