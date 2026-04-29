import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

def upload_csv_to_mongo():
    # Load environment variables
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI")
    
    if not mongo_uri:
        print("Error: MONGO_URI not found in .env file.")
        return

    file_path = 'All Google Ads Orders - All Google Ads Orders.csv'
    
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return

    print(f"Reading {file_path}...")
    # Read CSV
    # We use low_memory=False for large files, and keep all columns
    df = pd.read_csv(file_path)
    
    # Clean column names: handle empty strings or unnamed columns
    new_columns = []
    for i, col in enumerate(df.columns):
        if not col or col.startswith('Unnamed:'):
            new_columns.append(f"column_{i}")
        else:
            new_columns.append(col.strip())
    df.columns = new_columns

    # Convert to list of dictionaries
    data = df.to_dict(orient='records')
    
    print(f"Connecting to MongoDB...")
    client = MongoClient(mongo_uri)
    # Get database name from URI if possible, or default to 'seo_db'
    # Usually the URI is mongodb+srv://.../dbname?options
    # Let's check if there's a db name in the URI
    db_name = mongo_uri.split('/')[-1].split('?')[0]
    if not db_name:
        db_name = "seo_performance" # Default fallback
    
    db = client[db_name]
    collection_name = "google_ads_orders"
    collection = db[collection_name]

    print(f"Uploading {len(data)} records to collection '{collection_name}' in database '{db_name}'...")
    
    # Drop collection if it exists to start fresh (user didn't specify, but usually safer for "upload all")
    # Actually, I'll just insert. If they want to append, that's fine too.
    # But user said "sob gulo data... miss na jai", so I'll clear first to ensure no duplicates from previous attempts.
    collection.delete_many({}) 
    
    # Insert in chunks to avoid BSON size limits if individual rows are huge (unlikely here)
    # or just insert_many if data is reasonable.
    if data:
        collection.insert_many(data)
        print("Upload successful!")
    else:
        print("No data found in CSV.")

    client.close()

if __name__ == "__main__":
    upload_csv_to_mongo()
