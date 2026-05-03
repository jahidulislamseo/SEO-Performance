import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()
cur_month = '2026-04'

projects = list(db.projects_archive.find({'month': cur_month}))
total_wip = 0
for p in projects:
    if str(p.get('status', '')).strip() in ['WIP', 'Revision']:
        total_wip += float(p.get('amtX', 0) or 0)

print(f"April 2026 WIP Total: ${total_wip:,.2f}")
