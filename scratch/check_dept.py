from shared_utils import get_db
import json

db = get_db()
doc = db["dept_summary"].find_one({"_id": "current_stats"})
print(json.dumps(doc, indent=2, default=str))
