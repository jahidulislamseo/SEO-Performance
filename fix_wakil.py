import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('api/.env')
client = MongoClient(os.getenv('MONGO_URI'))
db = client['seo_dashboard']

res = db['members'].update_one({'id': '17488.0'}, {'$set': {'isOfficial': True}})
print(f"Matched: {res.matched_count}, Modified: {res.modified_count}")
