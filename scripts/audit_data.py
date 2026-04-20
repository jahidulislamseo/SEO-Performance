import json, os, urllib.request, re, time
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

SHEET_ID = os.getenv("SHEET_ID")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "seo_dashboard"

def get_sheet_data():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        if not match: return []
        data = json.loads(match.group(1))
        return data['table']['rows']

def audit():
    print("--- LIVE DATA AUDIT START ---")
    
    # 1. Fetch from Sheets
    rows = get_sheet_data()
    if not rows:
        print("Failed to fetch sheet data.")
        return

    sheet_delivered = 0.0
    sheet_wip = 0.0
    sheet_count = 0

    for r in rows[1:]:
        c = r['c']
        if not c: continue
        
        # COL indices (from server.py)
        # status: 19, service: 20, amount_x: 23
        status = str(c[19]['v'] if len(c)>19 and c[19] else '').strip()
        service = str(c[20]['v'] if len(c)>20 and c[20] else '').upper()
        amount = 0.0
        try:
            if len(c)>23 and c[23] and 'v' in c[23]:
                amount = float(c[23]['v'])
        except: pass

        if 'SEO' in service or 'SMM' in service:
            sheet_count += 1
            if status == "Delivered":
                sheet_delivered += amount
            elif status in ["WIP", "Revision"]:
                sheet_wip += amount

    print(f"Sheet Totals (SEO/SMM):")
    print(f"  Delivered: ${sheet_delivered:,.2f}")
    print(f"  WIP:       ${sheet_wip:,.2f}")
    print(f"  Total Rows: {sheet_count}")

    # 2. Fetch from MongoDB
    try:
        client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
        db = client[DB_NAME]
        dept_sum = db["dept_summary"].find_one({"_id": "current_stats"})
        
        if dept_sum:
            db_delivered = dept_sum.get("achieved", 0.0)
            db_wip = dept_sum.get("wipAmt", 0.0)
            
            print(f"\nDashboard (MongoDB) Totals:")
            print(f"  Delivered: ${db_delivered:,.2f}")
            print(f"  WIP:       ${db_wip:,.2f}")
            
            # 3. Compare
            diff_delivered = abs(sheet_delivered - db_delivered)
            diff_wip = abs(sheet_wip - db_wip)
            
            print("\nVerification Results:")
            if diff_delivered < 0.01:
                print("MATCH: Delivered Amount")
            else:
                print(f"MISMATCH: Delivered Amount (Diff: ${diff_delivered:,.2f})")
                
            if diff_wip < 0.01:
                print("MATCH: WIP Amount")
            else:
                print(f"MISMATCH: WIP Amount (Diff: ${diff_wip:,.2f})")
        else:
            print("\nMongoDB dept_summary collection is empty.")
    except Exception as e:
        print(f"\nError connecting to MongoDB: {e}")

if __name__ == "__main__":
    audit()
