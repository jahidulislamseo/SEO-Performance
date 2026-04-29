import sys
import os
sys.path.append(os.getcwd())
from shared_utils import get_db
db = get_db()
members = list(db.members.find().sort("name", 1))
for m in members:
    print(f"{m.get('id')} | {m.get('name')} | {m.get('team')}")
