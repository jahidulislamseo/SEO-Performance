import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db_name = mongo_uri.split('/')[-1].split('?')[0]
if not db_name:
    db_name = "seo_performance"
db = client[db_name]
collection = db["google_ads_orders"]
print(f"Total records in google_ads_orders: {collection.count_documents({})}")
client.close()
