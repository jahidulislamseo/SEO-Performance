from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI"))
db = client["seo_dashboard"]

project = db["projects_archive"].find_one()
print("Sample Project:")
print(project)

member = db["members"].find_one()
print("\nSample Member:")
print(member)
