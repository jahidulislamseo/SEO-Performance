import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('api/.env')
client = MongoClient(os.getenv('MONGO_URI'))
db = client['seo_dashboard']

hasibul = db['members'].find_one({'name': {'$regex': 'Hasibul', '$options': 'i'}})
print(f"Hasibul Official: {hasibul.get('isOfficial') if hasibul else 'NOT FOUND'}")

komal = db['members'].find_one({'name': {'$regex': 'Komal', '$options': 'i'}})
print(f"Komal Official: {komal.get('isOfficial') if komal else 'NOT FOUND'}")
