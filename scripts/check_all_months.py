import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()

months = db.projects_archive.distinct('month')
print(f"Available Months: {months}")

for m in sorted(months):
    projects = list(db.projects_archive.find({'month': m, 'status': 'Delivered'}))
    total = sum(float(p.get('amtX', 0) or 0) for p in projects)
    print(f"{m}: ${total:,.2f} ({len(projects)} projects)")
