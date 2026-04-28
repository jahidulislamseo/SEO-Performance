from shared_utils import get_db
import json

db = get_db()
m = db["members"].find_one()
print(json.dumps(m, indent=2, default=str))
