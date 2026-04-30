import json, urllib.request, re, time, os, logging
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo import UpdateOne
import agent_engine
from shared_utils import (
    SHEET_ID, MONGO_URI, DB_NAME, COL,
    get_db, parse_gviz_date, safe_float, fetch_sheet_data_gviz
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── MAIN SYNC ────────────────────────────────────────
def sync():
    logger.info("Starting Sync Process...")
    db = get_db()
    
    try:
        logger.info("Fetching Members...")
        member_rows = fetch_sheet_data_gviz("All Member Data")
        if not member_rows: raise ValueError("Could not fetch member data")

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
                                "team": "Dark Rankers" if str(r[6]).strip() == "SMM" else str(r[6]).strip(),
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
            logger.info(f"Synced {result.upserted_count + result.modified_count} members.")
    except Exception as e:
        logger.error(f"Member Sync Error: {e}")

    try:
        logger.info("Fetching Projects...")
        project_rows = fetch_sheet_data_gviz("Kam Data")
        if not project_rows: raise ValueError("Could not fetch project data")

        projects_collection = db["projects"]
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
            client_name = str(r[COL["client"]]).strip()
            amount = safe_float(r[COL["amount_x"]])
            
            # Create a unique, stable ID to prevent duplicates
            # Using row index (i) caused massive duplicates when rows shifted.
            # Now we use order_num + del_by + amount to make it unique per delivery without relying on row position.
            id_str = f"{order_num}_{del_by}_{client_name}_{amount}"
            doc_id = "".join(c for c in id_str if c.isalnum() or c == '_').strip("_")
            
            doc = {
                "order_num": order_num,
                "order_link": str(r[COL["order_link"]]),
                "instruction": str(r[COL["instruction"]]),
                "profile": str(r[COL["profile"]]),
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
            
            batch.append(UpdateOne({"_id": doc_id}, {"$set": doc}, upsert=True))
            
        if batch:
            # Instead of delete_many, we can rely on UPSERT with _id to avoid downtime
            result = projects_collection.bulk_write(batch)
            logger.info(f"Projects Sync: {result.upserted_count} new, {result.modified_count} updated.")
    except Exception as e:
        logger.error(f"Project Sync Error: {e}")

    logger.info("Sync Phase Complete.")
    
    try:
        logger.info("Triggering Recalculation Engine...")
        agent_engine.calculate_summaries()
    except Exception as e:
        logger.error(f"Summary Recalc Error: {e}")

if __name__ == "__main__":
    sync()
