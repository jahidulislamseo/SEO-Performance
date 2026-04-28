import os
from pymongo import MongoClient
from dotenv import load_dotenv

def separate_seo_projects():
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI")
    client = MongoClient(mongo_uri)
    db_name = mongo_uri.split('/')[-1].split('?')[0] or "seo_performance"
    db = client[db_name]
    
    source_col = db["google_ads_orders"]
    target_col = db["seo_google_ads_orders"]
    
    # Clear target collection
    target_col.delete_many({})
    
    # Find all SEO projects
    seo_projects = list(source_col.find({"column_0": "SEO"}, {"_id": 0}))
    
    if seo_projects:
        target_col.insert_many(seo_projects)
        print(f"Successfully separated {len(seo_projects)} SEO projects into 'seo_google_ads_orders' collection.")
    else:
        print("No SEO projects found to separate.")
        
    client.close()

if __name__ == "__main__":
    separate_seo_projects()
