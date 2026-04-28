
import os, sys, re, json, time, urllib.request
sys.path.append(os.getcwd())
from shared_utils import fetch_sheet_data_gviz, safe_float, normalize_assignee_token, get_db

def super_audit():
    print("--- FULL LIFECYCLE AUDIT: SEO & SMM ---")
    
    # 1. Fetch Live Sheet Data
    rows = fetch_sheet_data_gviz('Kam Data')
    
    # April 2026 filter
    current_month = "2026-04"
    
    live_stats = {
        "Delivered": {"count": 0, "sum": 0},
        "WIP": {"count": 0, "sum": 0},
        "Revision": {"count": 0, "sum": 0},
        "Cancelled": {"count": 0, "sum": 0}
    }
    
    for idx, r in enumerate(rows):
        if idx == 0: continue
        if len(r) < 24: continue
        
        status_raw = str(r[19]).strip()
        service_raw = str(r[20]).strip().upper()
        dt = str(r[22] if status_raw == 'Delivered' else r[3])
        
        # Dashboard Filter: SEO/SMM + Current Month
        if not re.search(r'SEO|SMM', service_raw): continue
        if current_month not in dt: continue
        
        amt = safe_float(r[23])
        
        # Map to standard categories
        status = "WIP"
        if status_raw == "Delivered": status = "Delivered"
        elif status_raw == "Cancelled": status = "Cancelled"
        elif "Revision" in status_raw: status = "Revision"
        elif "WIP" in status_raw: status = "WIP"
        
        if status in live_stats:
            live_stats[status]["count"] += 1
            live_stats[status]["sum"] += amt

    # 2. Fetch Dashboard Summary from MongoDB
    db = get_db()
    dept = db['dept_summary'].find_one({'_id': 'current_stats'})
    
    # Extract dashboard stats mapping
    dash_stats = {
        "Delivered": {"count": dept.get('delivered', 0), "sum": dept.get('achieved', 0)},
        "WIP": {"count": dept.get('wip', 0), "sum": dept.get('wipAmt', 0)},
        "Revision": {"count": dept.get('revision', 0), "sum": dept.get('revisionAmt', 0)},
        "Cancelled": {"count": dept.get('cancelled', 0), "sum": dept.get('cancelledAmt', 0)}
    }
    
    print("\n" + "="*70)
    print(f"{'STATUS':<15} | {'SHEET (QTY)':<12} | {'DASH (QTY)':<12} | {'SHEET ($)':<12} | {'DASH ($)':<12}")
    print("-" * 70)
    
    all_match = True
    for s in ["Delivered", "WIP", "Revision", "Cancelled"]:
        l_qty = live_stats[s]["count"]
        d_qty = dash_stats[s]["count"]
        l_sum = live_stats[s]["sum"]
        d_sum = dash_stats[s]["sum"]
        
        qty_match = "(OK)" if l_qty == d_qty else "(FAIL)"
        sum_match = "(OK)" if abs(l_sum - d_sum) < 0.1 else "(FAIL)"
        
        if l_qty != d_qty or abs(l_sum - d_sum) > 0.1: all_match = False
        
        print(f"{s:<15} | {l_qty:<10} {qty_match} | {d_qty:<10} | ${l_sum:>10,.2f} {sum_match} | ${d_sum:>10,.2f}")

    print("="*70)
    if all_match:
        print("\n🏆 RESULT: ALL CATEGORIES (DELIVERED, WIP, REVISION, CANCELLED) ARE 100% MATCHED!")
    else:
        print("\n⚠️ RESULT: DISCREPANCY FOUND IN PROJECT LIFECYCLE.")

if __name__ == "__main__":
    super_audit()
