
import os, sys, re, json, time, urllib.request
sys.path.append(os.getcwd())
from shared_utils import fetch_sheet_data_gviz, safe_float, normalize_assignee_token, get_db

def super_audit():
    print("--- SUPER AUDIT: LIVE SHEET VS DASHBOARD ---")
    
    # 1. Fetch Live Sheet Data
    print("Fetching live data from 'Kam Data'...")
    rows = fetch_sheet_data_gviz('Kam Data')
    
    # Data Buckets
    stats = {
        "SEO": {"delivered": 0, "wip": 0, "count": 0, "wip_count": 0},
        "SMM": {"delivered": 0, "wip": 0, "count": 0, "wip_count": 0},
        "OTHER": {"delivered": 0, "wip": 0, "count": 0, "wip_count": 0}
    }
    
    member_revenue = {} # To find Best Performer
    
    # April 2026 filter
    current_month = "2026-04"
    
    for idx, r in enumerate(rows):
        if idx == 0: continue
        if len(r) < 24: continue
        
        status = str(r[19]).strip()
        service_raw = str(r[20]).strip().upper()
        dt = str(r[22] if status == 'Delivered' else r[3])
        
        if current_month not in dt: continue
        
        category = "OTHER"
        if "SEO" in service_raw: category = "SEO"
        elif "SMM" in service_raw: category = "SMM"
        
        amt = safe_float(r[23])
        
        if status == 'Delivered':
            stats[category]["delivered"] += amt
            stats[category]["count"] += 1
            
            # 100% Accuracy Fix: Only attribute SEO/SMM to members
            if category in ["SEO", "SMM"]:
                assign_text = str(r[18]).strip()
                parts = [p.strip() for p in re.split(r"[/,]", assign_text) if p.strip()]
                if parts:
                    share = amt / len(parts)
                    for p in parts:
                        tk = normalize_assignee_token(p).title()
                        member_revenue[tk] = member_revenue.get(tk, 0) + share
                    
        elif status in ['WIP', 'Revision']:
            stats[category]["wip"] += amt
            stats[category]["wip_count"] += 1

    # 2. Fetch Dashboard Summary
    db = get_db()
    dept = db['dept_summary'].find_one({'_id': 'current_stats'})
    
    print("\n" + "="*50)
    print(f"{'METRIC':<20} | {'LIVE SHEET':<15} | {'DASHBOARD':<15}")
    print("-" * 50)
    
    # SEO Comparison
    live_seo_achieved = stats["SEO"]["delivered"]
    dash_seo_achieved = dept.get('achieved', 0) # Note: Global achieved is SEO+SMM in current logic
    
    # Calculate combined live achieved
    live_total_achieved = stats["SEO"]["delivered"] + stats["SMM"]["delivered"]
    live_total_wip = stats["SEO"]["wip"] + stats["SMM"]["wip"]
    
    print(f"{'Total Achieved':<20} | ${live_total_achieved:>13,.2f} | ${dept['achieved']:>13,.2f}")
    print(f"{'Total WIP':<20} | ${live_total_wip:>13,.2f} | ${dept['wipAmt']:>13,.2f}")
    print(f"{'SEO Delivered':<20} | ${stats['SEO']['delivered']:>13,.2f} | (Combined)")
    print(f"{'SMM Delivered':<20} | ${stats['SMM']['delivered']:>13,.2f} | (Combined)")
    print("-" * 50)
    
    # Best Performer Check
    best_p_sheet = sorted(member_revenue.items(), key=lambda x: x[1], reverse=True)[0]
    best_p_dash = dept.get('bestPerformer', {})
    
    print(f"{'Best Performer':<20} | {best_p_sheet[0]:<15} | {best_p_dash.get('name', 'N/A'):<15}")
    print(f"{'Performer Amt':<20} | ${best_p_sheet[1]:>13,.2f} | ${best_p_dash.get('deliveredAmt', 0):>13,.2f}")
    print("="*50)

    if abs(live_total_achieved - dept['achieved']) < 0.1:
        print("\n✅ DATA STATUS: 100% ACCURATE & SYNCHRONIZED")
    else:
        print("\n❌ DATA STATUS: DISCREPANCY DETECTED")

if __name__ == "__main__":
    super_audit()
