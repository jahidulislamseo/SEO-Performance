import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from shared_utils import get_db

db = get_db()
dept = db['dept_summary'].find_one({'_id': 'current_stats'})
if dept:
    print(f"Total WIP: {dept.get('wipAmt')}")
    print(f"Total Delivered: {dept.get('deliveredAmt')}")
    print(f"Total Cancelled: {dept.get('cancelledAmt')}")
    print(f"Total Projects: {dept.get('uniqueProjects')}")
    print(f"Matched Rows: {dept.get('matchedRows')}")
else:
    print('No dept_summary found.')
