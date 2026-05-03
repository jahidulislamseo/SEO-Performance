import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()

# Search for 30400, 30.4, or close values
projects = list(db.projects_archive.find({}))
for p in projects:
    amt = float(p.get('amtX', 0) or 0)
    if 30300 <= amt <= 30500 or 30.3 <= amt <= 30.5:
        print(f"Match: {p.get('order')} | Amt: {amt} | Date: {p.get('date')} | Team: {p.get('team')}")

# Also check summaries
sums = list(db.dept_summary.find({}))
for s in sums:
    if 30300 <= s.get('achieved', 0) <= 30500:
        print(f"Summary Match: {s.get('_id')} | Achieved: {s.get('achieved')}")
