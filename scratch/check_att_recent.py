from shared_utils import get_db
import json

db = get_db()
print("Recent attendance records:")
records = list(db["attendance"].find().sort("date", -1).limit(5))
for r in records:
    print(r)
