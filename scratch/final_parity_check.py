
import os, sys, re, json, time, urllib.request
sys.path.append(os.getcwd())
from shared_utils import fetch_sheet_data_gviz, safe_float

def parity_check():
    print("--- LIVE PARITY CHECK START ---")
    
    # 1. Fetch Fresh Sheet Data
    print("Fetching live data from 'Kam Data'...")
    rows = fetch_sheet_data_gviz('Kam Data')
    
    # Column indices
    # status: 19, amount_x: 23, date: 3, del_date: 22
    delivered_sum = 0
    wip_sum = 0
    delivered_count = 0
    wip_count = 0
    total_valid_rows = 0
    
    for idx, r in enumerate(rows):
        if idx == 0: continue # Header
        if len(r) < 24: continue
        
        status = str(r[19]).strip()
        service = str(r[20]).strip()
        
        # Dashboard only tracks SEO & SMM
        if not re.search(r'SEO|SMM', service, re.I): continue
        
        dt = str(r[22] if status == 'Delivered' else r[3])
        
        # Filter for April 2026
        if "2026-04" not in dt: continue
        
        amt = safe_float(r[23])
        total_valid_rows += 1
        
        if status == 'Delivered':
            delivered_sum += amt
            delivered_count += 1
        elif status in ['WIP', 'Revision']:
            wip_sum += amt
            wip_count += 1
            
    print(f"\n[GOOGLE SHEET LIVE STATS]")
    print(f"- Total Rows Found: {total_valid_rows}")
    print(f"- Delivered Count: {delivered_count} | Sum: ${delivered_sum:,.2f}")
    print(f"- WIP Count: {wip_count} | Sum: ${wip_sum:,.2f}")

    # 2. Fetch Dashboard Stats from MongoDB
    from shared_utils import get_db
    db = get_db()
    s = db['dept_summary'].find_one({'_id': 'current_stats'})
    
    print(f"\n[DASHBOARD (MONGODB) STATS]")
    print(f"- Achieved: ${s['achieved']:,.2f}")
    print(f"- WIP Amt: ${s['wipAmt']:,.2f}")
    print(f"- Matched Rows: {s['matchedRows']}")

    diff = abs(delivered_sum - s['achieved'])
    if diff < 0.01:
        print("\n✅ PERFECT PARITY! Live Sheet and Dashboard are 100% SAME.")
    else:
        print(f"\n❌ DISCREPANCY: ${diff:,.2f}")

if __name__ == "__main__":
    parity_check()
