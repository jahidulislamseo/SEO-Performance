import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()
cur_month = '2026-04'

projects = list(db.projects_archive.find({'month': cur_month}))
user_gross = 0
user_net = 0
count = 0

for p in projects:
    if str(p.get('status', '')).strip() == 'Delivered':
        # Check if user matches. 
        # In the sheet it's "Employee ID" which maps to 'id' maybe?
        # Let's check keys in a project.
        pass

p = projects[0]
print(f"Project keys: {p.keys()}")

for p in projects:
    if str(p.get('status', '')).strip() == 'Delivered':
        # Let's assume the user ID is in a field.
        # Based on shared_utils, it might be 'id' or 'emp_id'.
        if str(p.get('id', '')) == '18998':
            user_gross += float(p.get('amtX', 0) or 0)
            user_net += float(p.get('net_amt', 0) or 0)
            count += 1

print(f"User 18998 April Breakdown:")
print(f"Count: {count}")
print(f"Gross: ${user_gross:,.2f}")
print(f"Net: ${user_net:,.2f}")
