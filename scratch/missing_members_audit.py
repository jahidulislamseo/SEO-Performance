import os, sys, re, json, time, urllib.request
sys.path.append(os.getcwd())
from dotenv import load_dotenv
from shared_utils import normalize_name, fetch_sheet_data_gviz

load_dotenv()

def audit_missing_members():
    print("--- DATA ACCURACY AUDIT START ---")
    
    # 1. Fetch Roster
    print("Fetching Roster from 'All Member Data'...")
    roster_rows = fetch_sheet_data_gviz('All Member Data')
    roster_names = set()
    for r in roster_rows:
        if len(r) > 1:
            name = normalize_name(r[1]).lower()
            if name and name != 'employee name':
                roster_names.add(name)
    
    print(f"Total Members in Roster: {len(roster_names)}")

    # 2. Fetch Projects for April 2026
    print("Fetching Projects from 'Kam Data'...")
    project_rows = fetch_sheet_data_gviz('Kam Data')
    
    missing = {}
    total_unmatched_amt = 0
    
    # Column indices from shared_utils.COL
    # assign: 18, amount_x: 23, date: 3, del_date: 22, status: 19
    for idx, r in enumerate(project_rows):
        if idx == 0: continue # Header
        if len(r) < 24: continue
        
        status = str(r[19]).strip()
        if status not in ['Delivered', 'WIP', 'Revision']: continue
        
        # Date Filter (Approximate for April 2026)
        dt = str(r[22] if status == 'Delivered' else r[3])
        if "2026-04" not in dt: continue
        
        assign_text = str(r[18]).strip()
        amt = 0
        try: amt = float(str(r[23]).replace("$","").replace(",",""))
        except: pass
        
        if not assign_text or assign_text.lower() in ['n/a', '']:
            missing['EMPTY'] = missing.get('EMPTY', 0) + amt
            continue
            
        parts = [p.strip() for p in re.split(r"[/,]", assign_text)]
        found_any = False
        for p in parts:
            tk = normalize_name(p).lower()
            if tk in roster_names:
                found_any = True
                break
        
        if not found_any:
            missing[assign_text] = missing.get(assign_text, 0) + amt
            total_unmatched_amt += amt

    print("\n--- MISSING ASSIGNEES (Names in projects but NOT in roster) ---")
    sorted_missing = sorted(missing.items(), key=lambda x: x[1], reverse=True)
    for name, amt in sorted_missing:
        print(f"- {name}: ${amt:,.2f}")
    
    print(f"\nTotal Unmatched Revenue: ${total_unmatched_amt:,.2f}")
    print("--- AUDIT COMPLETE ---")

if __name__ == "__main__":
    audit_missing_members()
