import os
import sys
import re
from dotenv import load_dotenv

# Add api directory to path for shared_utils
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db, safe_float

def verify_april():
    load_dotenv("api/.env")
    db = get_db()
    
    data_path = "scratch/april_user_data.tsv"
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    results = []
    found_count = 0
    missing_count = 0

    print(f"{'Status':<10} | {'Amount':<8} | {'Team':<15} | {'URL/Identifier'}")
    print("-" * 80)

    missing_items = []
    for line in lines:
        parts = line.strip().split("\t")
        if not parts: continue
        
        url_id = parts[0].strip()
        members = parts[3].strip() if len(parts) > 3 else ""
        status = parts[4].strip() if len(parts) > 4 else ""
        team = parts[6].strip() if len(parts) > 6 else ""
        amt_str = parts[8].strip() if len(parts) > 8 else "0"
        amt = safe_float(amt_str)
        
        # Search strategy 1: URL/Link
        query_url = {
            "$or": [
                {"link": url_id},
                {"order": url_id},
                {"instruction": url_id}
            ]
        }
        found = db.projects_archive.find_one(query_url)
        
        # Search strategy 2: Fuzzy match
        if not found:
            query_fuzzy = {
                "amtX": {"$gte": amt - 0.01, "$lte": amt + 0.01},
                "team": team,
                "status": status
            }
            fuzzy_matches = list(db.projects_archive.find(query_fuzzy))
            for m in fuzzy_matches:
                db_assign = str(m.get("assign", "")).lower()
                user_assign_parts = [p.strip().lower() for p in re.split(r"[/,]", members)]
                for p in user_assign_parts:
                    if p and p in db_assign:
                        found = m
                        break
                if found: break

        if found:
            found_count += 1
            # print(f"{'FOUND':<10} | {amt:<8.2f} | {team:<15} | {url_id[:50]}...")
        else:
            missing_count += 1
            missing_items.append(line.strip())
            print(f"{'MISSING':<10} | {amt:<8.2f} | {team:<15} | {url_id}")

    print("-" * 80)
    print(f"Total Checked: {len(lines)}")
    print(f"Found in DB: {found_count}")
    print(f"Missing from DB: {missing_count}")
    
    if missing_items:
        print("\n--- DETAILED LIST OF MISSING PROJECTS ---")
        for item in missing_items:
            print(item)

if __name__ == "__main__":
    verify_april()
