import os
import sys
import time
import re
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

# Add paths
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "api"))

from shared_utils import (
    COL, get_db, fetch_sheet_data_gviz, safe_float, normalize_assignee_token, NAME_ALIASES
)

def verify_members():
    print("👤 VERIFYING MEMBER-LEVEL PARITY (Sheet vs MongoDB)")
    print("-" * 60)
    
    db = get_db()
    load_dotenv("api/.env")
    
    # 1. Fetch from Sheets
    print("📡 Fetching Kam Data from Sheets...")
    raw_rows = fetch_sheet_data_gviz("Kam Data")
    if not raw_rows:
        print("❌ Error: Could not fetch sheet data.")
        return
        
    df = pd.DataFrame(raw_rows)
    if df.iloc[0, 0] == "ID":
        df.columns = df.iloc[0]
        df = df.drop(df.index[0])
    
    col_map = {v: k for k, v in COL.items()}
    df = df.rename(columns=lambda x: col_map.get(x, x) if isinstance(x, int) else x)
    
    # 2. Filter exactly like agent_engine
    df['amount_x'] = df['amount_x'].apply(safe_float).fillna(0.0)
    df = df[df['service'].str.contains('SEO|SMM', case=False, na=False)]
    
    cur_y = time.strftime("%Y")
    cur_m = time.strftime("%m")
    df['calc_date'] = pd.to_datetime(df['date'].astype(str), errors='coerce')
    mask_last_day = df['calc_date'].dt.is_month_end
    df.loc[mask_last_day, 'calc_date'] = df.loc[mask_last_day, 'calc_date'] + pd.Timedelta(days=1)
    
    current_start = pd.Timestamp(f"{cur_y}-{cur_m}-01")
    next_month = current_start + pd.offsets.MonthBegin(1)
    df_curr = df[(df['calc_date'] >= current_start) & (df['calc_date'] < next_month)].copy()
    
    # 3. Process Splits (Exactly like agent_engine)
    members_list = list(db["members"].find({"isOfficial": True}))
    member_lookup = {m["name"].strip().lower(): m["name"] for m in members_list}
    aliases = NAME_ALIASES()
    for alias, official in aliases.items():
        member_lookup[alias.lower()] = official

    expanded_rows = []
    for _, row in df_curr.iterrows():
        assign_text = str(row.get('assign', ''))
        amt_x = row.get('amount_x', 0.0)
        parts = [p.strip() for p in re.split(r"[/,]", assign_text)]
        unique_tokens = set()
        found_names = []
        for p in parts:
            tk = normalize_assignee_token(p).lower()
            if not tk: continue
            unique_tokens.add(tk)
            official_name = member_lookup.get(tk)
            if official_name:
                found_names.append(official_name)
        
        found_names = list(set(found_names))
        num_assigned = len(unique_tokens) if unique_tokens else 1
        share_x = round(amt_x / num_assigned, 2)
        
        for name in found_names:
            expanded_rows.append({
                'name': name,
                'status': row.get('status'),
                'share': share_x
            })

    edf = pd.DataFrame(expanded_rows)
    
    # 4. Aggregate Sheet Stats
    sheet_stats = {}
    if not edf.empty:
        for name in edf['name'].unique():
            m_df = edf[edf['name'] == name]
            delivered = m_df[m_df['status'] == 'Delivered']
            wip = m_df[m_df['status'].isin(['WIP', 'Revision'])]
            cancelled = m_df[m_df['status'] == 'Cancelled']
            
            sheet_stats[name] = {
                'done_amt': round(delivered['share'].sum(), 2),
                'done_count': len(delivered),
                'wip_amt': round(wip['share'].sum(), 2),
                'wip_count': len(wip),
                'can_count': len(cancelled)
            }

    # 5. Fetch DB Stats
    db_summaries = {m['name']: m for m in db["member_summaries"].find({})}
    
    # 6. Compare
    print(f"\n{'Member Name':20} | {'Status':8} | {'Sheet':10} | {'DB':10} | {'Result'}")
    print("-" * 65)
    
    mismatches = 0
    all_members = sorted(list(set(list(sheet_stats.keys()) + list(db_summaries.keys()))))
    
    for name in all_members:
        s = sheet_stats.get(name, {'done_amt':0, 'done_count':0, 'wip_amt':0, 'wip_count':0, 'can_count':0})
        d = db_summaries.get(name, {'deliveredAmt':0, 'delivered':0, 'wipAmt':0, 'wip':0 + (0), 'revision':0, 'cancelled':0})
        
        # Note: DB combines WIP and Revision count in some views, but member_summaries has them separate.
        # agent_engine saves: "wip": len(WIP only), "revision": len(Revision only)
        # But for comparison we combine them if needed.
        
        # Check Done Amt
        res_done = "✅" if abs(s['done_amt'] - d.get('deliveredAmt', 0)) < 0.01 else "❌"
        # Check WIP Amt
        res_wip = "✅" if abs(s['wip_amt'] - d.get('wipAmt', 0)) < 0.01 else "❌"
        # Check Cancelled Count
        res_can = "✅" if s['can_count'] == d.get('cancelled', 0) else "❌"
        
        if res_done == "❌" or res_wip == "❌" or res_can == "❌":
            mismatches += 1
            print(f"{name:20} | Done Amt | ${s['done_amt']:9.2f} | ${d.get('deliveredAmt',0):9.2f} | {res_done}")
            print(f"{' ':20} | WIP Amt  | ${s['wip_amt']:9.2f} | ${d.get('wipAmt',0):9.2f} | {res_wip}")
            print(f"{' ':20} | Cancelled| {s['can_count']:9} | {d.get('cancelled',0):9} | {res_can}")
            print("-" * 65)

    if mismatches == 0:
        print("\n🎉 ALL MEMBERS MATCH 100% PERFECTLY!")
        print(f"Total members verified: {len(all_members)}")
    else:
        print(f"\n⚠️ Found {mismatches} mismatches.")

if __name__ == "__main__":
    verify_members()
