import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from shared_utils import get_db

db = get_db()
p = db['projects_archive'].find_one({'order': 'FO322719AF907'})
if p:
    print(f"Order: {p.get('order')}")
    print(f"Client: {p.get('client')}")
    print(f"Status: {p.get('status')}")
    print(f"Order Date: {p.get('date')}")
    print(f"Delivery Date: {p.get('deliveredDate')}")
    print(f"Month Bucket: {p.get('month')}")
else:
    print('Project not found!')
