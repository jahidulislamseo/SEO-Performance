import csv
import os
import re
import time
from datetime import datetime
from pymongo import UpdateOne
from shared_utils import get_db, safe_float

def parse_date(date_str):
    if not date_str or str(date_str).lower() in ['n/a', 'none', '']:
        return None
    
    date_str = str(date_str).strip()
    
    # Try format: "February 5, 2025"
    try:
        dt = datetime.strptime(date_str, "%B %d, %Y")
        return dt.strftime("%Y-%m-%d")
    except:
        pass
        
    # Try format: "Aug 25_2023, AT 03:09:00 PM"
    try:
        # Extract "Aug 25_2023"
        match = re.search(r'([A-Za-z]{3})\s+(\d{1,2})_(\d{4})', date_str)
        if match:
            m_name, d, y = match.groups()
            dt = datetime.strptime(f"{m_name} {d} {y}", "%b %d %Y")
            return dt.strftime("%Y-%m-%d")
    except:
        pass
        
    return None

def import_csv():
    csv_path = "../data_legacy/All Google Ads Orders - All Google Ads Orders.csv"
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found")
        return

    db = get_db()
    print(f"Reading CSV: {csv_path}")
    
    with open(csv_path, mode='r', encoding='utf-8') as f:
        # The first column is empty in the header, so DictReader will handle it
        reader = csv.DictReader(f)
        operations = []
        count = 0
        
        for row in reader:
            # Handle possible name mapping issues if header is slightly different
            order_id = (row.get('Order Id') or row.get('Order ID') or '').strip()
            if not order_id or order_id.lower() in ['n/a', 'none', '']:
                continue
                
            # Date logic
            raw_date = row.get('Order Date') or row.get('Deadline') or ''
            clean_date = parse_date(raw_date)
            
            month_bucket = clean_date[:7] if clean_date else "Unknown"
            
            doc = {
                "order": order_id,
                "client": row.get('Client Names') or '',
                "service": "Google Ads", # Since the file is "All Google Ads Orders"
                "status": row.get('Status') or 'Unknown',
                "amtX": 0.0, # No amount in this CSV
                "date": clean_date or '',
                "month": month_bucket,
                "deliveredDate": clean_date if (row.get('Status') == 'Delivered') else '',
                "assign": row.get('Assigned') or '',
                "profile": row.get('Profiles') or '',
                "link": row.get('Order Id') if 'fiverr.com' in str(row.get('Order Id')) else '', # fallback
                "instruction": row.get('Instruction Sheet') or '',
                "last_seen": time.time(),
                "source": "legacy_csv_ads"
            }
            
            # Additional fallback for Order Link if it exists in other columns
            if not doc["link"] and row.get('Website'):
                doc["link"] = row.get('Website')

            operations.append(UpdateOne({"order": order_id}, {"$set": doc}, upsert=True))
            count += 1
            
            if len(operations) >= 500:
                db["projects_archive"].bulk_write(operations, ordered=False)
                print(f"Uploaded {count} records...")
                operations = []
        
        if operations:
            db["projects_archive"].bulk_write(operations, ordered=False)
            print(f"Uploaded {count} records... Done.")

if __name__ == "__main__":
    import_csv()
