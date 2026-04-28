import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db_name = mongo_uri.split('/')[-1].split('?')[0] or "seo_performance"
db = client[db_name]
collection = db["google_ads_orders"]

# Search for "SEO" in any field
query = {"$or": []}
# Get all keys to search in
sample = collection.find_one()
if sample:
    for key in sample.keys():
        if key != "_id":
            query["$or"].append({key: {"$regex": "SEO", "$options": "i"}})

count = collection.count_documents(query)
print(f"Total documents containing 'SEO': {count}")

if count > 0:
    first_match = collection.find_one(query)
    print("First matching document sample:")
    print(first_match)

client.close()
