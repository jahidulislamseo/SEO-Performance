import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()

# Aggregate by month
pipeline = [
    {"$match": {"status": "Delivered"}},
    {"$group": {
        "_id": "$month",
        "total": {"$sum": "$amtX"},
        "count": {"$sum": 1}
    }},
    {"$sort": {"_id": 1}}
]

results = list(db.projects_archive.aggregate(pipeline))
print("Monthly Delivery Totals (All Teams):")
for r in results:
    print(f"{r['_id']}: ${r['total']:,.2f} ({r['count']} projects)")
