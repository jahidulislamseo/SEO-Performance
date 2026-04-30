import pandas as pd
import sys
import os
from datetime import datetime

# Add api dir to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'api'))

from shared_utils import get_db, normalize_assignee_token, MONGO_URI

print(f"DEBUG: MONGO_URI is {'set' if MONGO_URI else 'NOT SET'}")

file_path = r'c:\Users\Jahidul Islam\Downloads\jahidul\data_legacy\All Google Ads Orders - All Google Ads Orders.csv'

def parse_date(d):
    if not d or pd.isna(d): return None
    s = str(d).strip().replace(' ,', ',').replace('_', ' ')
    # Handle "Aug 25, 2023, AT 03:09:00 PM"
    if ', AT' in s: s = s.split(', AT')[0]
    
    formats = ['%B %d, %Y', '%b %d, %Y', '%Y-%m-%d']
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except:
            continue
    return s

def import_data():
    print("Reading CSV...")
    df = pd.read_csv(file_path, low_memory=False)
    print(f"Read {len(df)} rows. Connecting to DB...")
    db = get_db()
    archive = db['projects_archive']
    print("Preparing documents...")
    docs = []
    for i, row in df.iterrows():
        if i % 1000 == 0: print(f"Processing row {i}...")
        # Heuristic mapping
        # Some rows have the name in 'Unnamed: 0' and ID in 'Assigned'
        assign_raw = str(row['Assigned'] if pd.notna(row['Assigned']) else row['Unnamed: 0']).strip()
        order_id = str(row['Order Id'] if pd.notna(row['Order Id']) else row['Profiles']).strip()
        
        if not assign_raw or assign_raw == 'nan': continue
        if not order_id or order_id == 'nan': continue
        
        # Skip if looks like ID
        if assign_raw.startswith('FO') or assign_raw.isdigit():
            # swap if possible
            if not order_id.startswith('FO') and not order_id.isdigit():
                assign_raw, order_id = order_id, assign_raw
        
        status = str(row['Status']).strip() if pd.notna(row['Status']) else 'Unknown'
        client = str(row['Client Names']).strip() if pd.notna(row['Client Names']) else 'Unknown'
        date = parse_date(row['Order Date'])
        instruction = str(row['Instruction Sheet']).strip() if pd.notna(row['Instruction Sheet']) else None
        service = str(row['Service Line']).strip() if pd.notna(row['Service Line']) else 'Google Ads'
        
        if not date: continue
        
        doc = {
            'order': order_id,
            'client': client,
            'assign': assign_raw,
            'status': status,
            'service': service,
            'date': date,
            'instruction': instruction,
            'amtX': 0, # CSV doesn't seem to have amounts
            'month': date[:7] if date else 'Unknown'
        }
        docs.append(doc)
        
    if docs:
        print(f"Importing {len(docs)} projects...")
        # archive.insert_many(docs) # We'll use upsert logic to avoid duplicates if run multiple times
        for doc in docs:
            archive.update_one(
                {'order': doc['order'], 'client': doc['client'], 'date': doc['date']},
                {'$set': doc},
                upsert=True
            )
        print("Import complete.")
    else:
        print("No valid data found to import.")

if __name__ == '__main__':
    import_data()
