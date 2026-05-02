import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from shared_utils import get_db

db = get_db()
m = db['member_summaries'].find_one({'id': '17137'})
if m and 'projects' in m:
    for p in m['projects']:
        print(f"{p.get('order')} - Status: {p.get('status')} - OrderDate: {p.get('date')}")
else:
    print('No projects found.')
