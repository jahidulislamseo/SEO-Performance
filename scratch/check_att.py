from shared_utils import get_db
from datetime import datetime
import json

db = get_db()
today = datetime.now().strftime("%Y-%m-%d")
print(f"Checking for date: {today}")
records = list(db["attendance"].find({"date": today}))
print(f"Found {len(records)} records")
for r in records[:5]:
    print(r)
