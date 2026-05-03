import os
import sys
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

db = get_db()
p = db.projects_archive.find_one({'month': '2026-04'})
if p:
    print(f"Sample Document Keys: {p.keys()}")
    print(f"Sales Dept: '{p.get('sales_dept')}'")
    print(f"Emp Name: '{p.get('emp_name')}'")
    print(f"Month: '{p.get('month')}'")
else:
    print("No document found for 2026-04")
