import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()
cur_month = '2026-04'

projects = list(db.projects_archive.find({'month': cur_month}))
total_delivered = 0
delivered_count = 0

for p in projects:
    service = str(p.get('service', '')).upper()
    if ('SEO' in service or 'SMM' in service) and str(p.get('status', '')).strip() == 'Delivered':
        total_delivered += float(p.get('amtX', 0) or 0)
        delivered_count += 1

print(f"April 2026 SEO/SMM Summary:")
print(f"Delivered SEO/SMM Projects: {delivered_count}")
print(f"Total Delivered SEO/SMM Amount: ${total_delivered:,.2f}")
