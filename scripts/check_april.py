import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()
cur_month = '2026-04'

# In projects_archive, the field is 'amtX' and status is 'Delivered'
# However, agent_engine also stores 'month' field.
projects = list(db.projects_archive.find({'month': cur_month}))
total_delivered = 0
delivered_count = 0

for p in projects:
    if str(p.get('status', '')).strip() == 'Delivered':
        total_delivered += float(p.get('amtX', 0) or 0)
        delivered_count += 1

print(f"April 2026 Summary:")
print(f"Total Projects in Archive: {len(projects)}")
print(f"Delivered Projects: {delivered_count}")
print(f"Total Delivered Amount: ${total_delivered:,.2f}")
