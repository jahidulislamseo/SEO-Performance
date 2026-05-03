import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()
cur_month = '2026-04'

# Query by sales_dept which we just synced
projects = list(db.projects_archive.find({
    'month': cur_month,
    'sales_dept': 'SAA Team Old',
    'status': 'Delivered'
}))

total_gross = 0
total_net = 0
count = 0

for p in projects:
    # amtX is currently storing column 23 (Net) based on COL mapping
    # Let's check if we have a gross field? 
    # Actually shared_utils maps amount_x to 23 (Net).
    # We should have mapped Column 7 (Gross) too.
    net = float(p.get('amount_x', 0) or 0)
    total_net += net
    count += 1

print(f"April 2026 'SAA Team Old' Breakdown (DB Sync):")
print(f"Count: {count}")
print(f"Total Net: ${total_net:,.2f}")
