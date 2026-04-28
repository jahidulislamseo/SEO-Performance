
import os, sys, re, json, time, urllib.request
sys.path.append(os.getcwd())
from shared_utils import fetch_sheet_data_gviz, safe_float, normalize_assignee_token, get_db

def member_audit():
    print("--- MEMBER PARITY AUDIT: LIVE SHEET VS DASHBOARD ---")
    
    # 1. Fetch Live Sheet Data
    rows = fetch_sheet_data_gviz('Kam Data')
    current_month = "2026-04"
    
    sheet_members = {}
    
    for idx, r in enumerate(rows):
        if idx == 0: continue
        if len(r) < 24: continue
        
        status = str(r[19]).strip()
        service = str(r[20]).strip().upper()
        dt = str(r[22] if status == 'Delivered' else r[3])
        
        if not re.search(r'SEO|SMM', service): continue
        if current_month not in dt: continue
        
        amt = safe_float(r[23])
        assign_text = str(r[18]).strip()
        parts = [p.strip() for p in re.split(r"[/,]", assign_text) if p.strip()]
        
        if not parts: continue
        
        share = amt / len(parts)
        aliases = {"jobaed": "Jobaeid"} # Basic alias check for audit
        for p in parts:
            tk = normalize_assignee_token(p).lower()
            name = aliases.get(tk, tk.title())
            if name not in sheet_members:
                sheet_members[name] = {"delivered": 0, "wip": 0}
            
            if status == "Delivered":
                sheet_members[name]["delivered"] += share
            elif status in ["WIP", "Revision"]:
                sheet_members[name]["wip"] += share

    # 2. Fetch Dashboard Data
    db = get_db()
    dash_mems = list(db["member_summaries"].find({}, {"_id": 0, "name": 1, "deliveredAmt": 1, "wipAmt": 1}))
    dash_map = {m["name"]: m for m in dash_mems}
    
    # 3. Comparison Table
    print("\n" + "="*75)
    print(f"{'MEMBER NAME':<20} | {'SHEET ($)':<12} | {'DASH ($)':<12} | {'WIP SHEET':<10} | {'WIP DASH'}")
    print("-" * 75)
    
    # Sort by sheet revenue to check top earners
    sorted_names = sorted(sheet_members.keys(), key=lambda x: sheet_members[x]["delivered"], reverse=True)
    
    mismatches = 0
    for name in sorted_names:
        s_data = sheet_members[name]
        d_data = dash_map.get(name, {"deliveredAmt": 0, "wipAmt": 0})
        
        s_del = s_data["delivered"]
        d_del = d_data.get("deliveredAmt", 0)
        
        if abs(s_del - d_del) >= 0.1:
            mismatches += 1
            print(f"MISMATCH: {name:<20} | Sheet: ${s_del:>10,.2f} | Dash: ${d_del:>10,.2f}")

    print("="*75)
    
    total_members = len(sheet_members)
    matched_members = sum(1 for name in sheet_members if abs(sheet_members[name]["delivered"] - dash_map.get(name, {}).get("deliveredAmt", 0)) < 0.1)
    
    print(f"\nAudit Summary:")
    print(f"- Total Members with Data: {total_members}")
    print(f"- Perfectly Matched Members: {matched_members}")
    print(f"- Consistency Rate: {(matched_members/total_members)*100:.1f}%")

if __name__ == "__main__":
    member_audit()
