import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('api/.env')
client = MongoClient(os.getenv('MONGO_URI'))
db = client['seo_dashboard']

docs = list(db['projects_archive'].find({'status': 'Delivered', 'month': '2026-05'}, {'order': 1, 'assign': 1, 'amtX': 1, '_id': 0}))
for d in docs:
    print(f"Order: {d.get('order')} - Assignee: {d.get('assign')} - Amount: {d.get('amtX')}")
