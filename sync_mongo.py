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
        member_ops = []
        for i, r in enumerate(member_rows):
            if i == 0: continue # Skip header
            if len(r) > 6 and r[0] and r[2]: 
                member_id = str(r[0]).strip()
                member_ops.append(
                    UpdateOne(
                        {"id": member_id},
                        {
                            "$set": {
                                "name": str(r[2]).strip(),
                                "fullName": str(r[1]).strip() if len(r)>1 else str(r[2]),
                                "team": str(r[6]).strip(),
                                "role": str(r[3]).strip() if len(r) > 3 else "Member",
                                "email": str(r[4]).strip() if len(r) > 4 else "",
                                "phone": str(r[5]).strip() if len(r) > 5 else "",
                                "joinDate": str(r[7]).strip() if len(r) > 7 else "",
                                "manager": str(r[8]).strip() if len(r) > 8 else "Mehedi Hassan",
                                "updated_at": time.time()
                            },
                            "$setOnInsert": {"password": "pass123"}
                        },
                        upsert=True
                    )
                )
        if member_ops:
            result = members_collection.bulk_write(member_ops)
            print(f"Synced {result.upserted_count + result.modified_count} members.")

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
