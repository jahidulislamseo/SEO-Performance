import os
import sys
import time
import pandas as pd
from pymongo import MongoClient

# Add paths
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "api"))

from shared_utils import (
    COL, get_db, fetch_sheet_data_gviz, TEAM_TARGETS, safe_float
)

def verify():
    print("🔍 VERIFYING DATA PARITY (Sheet vs MongoDB)")
    print("-" * 50)
    
    db = get_db()
    
    # 1. Fetch from Sheets (Exactly like agent_engine)
    print("📡 Fetching Kam Data from Sheets...")
    raw_rows = fetch_sheet_data_gviz("Kam Data")
    if not raw_rows:
        print("❌ Error: Could not fetch sheet data.")
        return
        
    df = pd.DataFrame(raw_rows)
    if df.iloc[0, 0] == "ID": # Header logic
        df.columns = df.iloc[0]
        df = df.drop(df.index[0])
    
    # Map columns
    col_map = {v: k for k, v in COL.items()}
    df = df.rename(columns=lambda x: col_map.get(x, x) if isinstance(x, int) else x)
    
    # Clean and Filter (Exactly like agent_engine)
    def clean_amt(val):
        if pd.isna(val) or val == '': return 0.0
        try: return float(str(val).replace("$","").replace(",","").strip())
        except: return 0.0
    
    df['amount_x'] = df['amount_x'].apply(clean_amt).fillna(0.0)
    df = df[df['service'].str.contains('SEO|SMM', case=False, na=False)]
    
    cur_y = time.strftime("%Y")
    cur_m = time.strftime("%m")
    df['calc_date'] = pd.to_datetime(df['date'].astype(str), errors='coerce')
    mask_last_day = df['calc_date'].dt.is_month_end
    df.loc[mask_last_day, 'calc_date'] = df.loc[mask_last_day, 'calc_date'] + pd.Timedelta(days=1)
    
    current_start = pd.Timestamp(f"{cur_y}-{cur_m}-01")
    next_month = current_start + pd.offsets.MonthBegin(1)
    df_curr = df[(df['calc_date'] >= current_start) & (df['calc_date'] < next_month)].copy()
    
    print(f"📊 Sheet Rows for {cur_y}-{cur_m}: {len(df_curr)}")
    
    # 2. Compare Global Totals
    sheet_delivered = df_curr[df_curr['status'] == 'Delivered']['amount_x'].sum()
    sheet_wip = df_curr[df_curr['status'].isin(['WIP', 'Revision'])]['amount_x'].sum()
    
    dept_sum = db["dept_summary"].find_one({"_id": "current_stats"})
    db_delivered = dept_sum.get("achieved", 0.0)
    db_wip = dept_sum.get("wipAmt", 0.0)
    
    print("\n--- GLOBAL STATS ---")
    print(f"Sheets Delivered:  ${sheet_delivered:,.2f}")
    print(f"MongoDB Delivered: ${db_delivered:,.2f}")
    print(f"Sheets WIP:        ${sheet_wip:,.2f}")
    print(f"MongoDB WIP:       ${db_wip:,.2f}")
    
    if abs(sheet_delivered - db_delivered) < 0.01:
        print("✅ Global Delivered matches.")
    else:
        print("❌ Global Delivered MISMATCH!")

    # 3. Team Breakdown
    print("\n--- TEAM STATS ---")
    TEAM_TAG_MAP = {
        "GEO Rankers": "Geo_Rankers",
        "Rank Riser": "Rank_Riser",
        "Search Apex": "Search_Apex",
        "Dark Rankers": "Dark_Rankers"
    }
    
    team_sums = db["team_summaries"].find_one({"_id": "current_stats"})
    db_teams = team_sums.get("teams", {})
    
    for team, tag in TEAM_TAG_MAP.items():
        t_df = df_curr[df_curr['op_dept'].astype(str).str.strip().str.lower() == tag.lower()]
        sheet_amt = t_df[t_df['status'] == 'Delivered']['amount_x'].sum()
        db_amt = db_teams.get(team, {}).get("deliveredAmt", 0.0)
        
        icon = "✅" if abs(sheet_amt - db_amt) < 0.01 else "❌"
        print(f"{icon} {team:15}: Sheet ${sheet_amt:10,.2f} | DB ${db_amt:10,.2f}")

    # 4. Member Check (Sample)
    print("\n--- MEMBER STATS (Sample) ---")
    # This part is more complex due to splitting, but let's check counts
    sheet_members = list(db["members"].find({"isOfficial": True}))
    db_member_sums = list(db["member_summaries"].find({}))
    
    print(f"Official Members in DB: {len(sheet_members)}")
    print(f"Member Summaries in DB: {len(db_member_sums)}")
    
    if len(sheet_members) == len(db_member_sums):
        print("✅ Member counts match.")
    else:
        print("❌ Member counts MISMATCH!")

    print("\n" + "-" * 50)
    print("Verification Complete.")

if __name__ == "__main__":
    verify()
