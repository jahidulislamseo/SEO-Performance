import os
import sys
import time
import pandas as pd
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# Add project root and api directory to path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "api"))

from shared_utils import (
    SHEET_ID, MONGO_URI, DB_NAME, COL,
    get_db, fetch_sheet_data_gviz, DEPT_TARGET, TEAM_TARGETS
)
import agent_engine

def run_audit():
    print("🚀 SEO PERFORMANCE HUB - MASTER AUDIT ENGINE")
    print(f"Time: {time.ctime()}")
    print("-" * 50)

    # 1. Fetch RAW Data (Live from Sheets)
    print("📡 Fetching LIVE data from Google Sheets...")
    rows = fetch_sheet_data_gviz("Kam Data")
    if not rows:
        print("❌ Error: Failed to fetch live data.")
        return
        
    df_live = pd.DataFrame(rows)
    # Map column names based on COL indices
    col_map = {v: k for k, v in COL.items()}
    df_live = df_live.rename(columns=lambda x: col_map.get(x, x) if isinstance(x, int) else x)
    
    # Standard cleanup
    def clean_amt(val):
        try: return float(str(val).replace("$","").replace(",","").strip())
        except: return 0.0
    if 'amount_x' in df_live.columns:
        df_live['amount_x'] = df_live['amount_x'].apply(clean_amt)

    # 2. Filter for Current Month (Same logic as engine)
    cur_y = time.strftime("%Y")
    cur_m = time.strftime("%m")
    cur_month_name = time.strftime("%B")
    
    def is_in_cur(row):
        status = str(row.get('status', '')).strip()
        date_val = str(row.get('del_date', '')) if status == 'Delivered' else str(row.get('date', ''))
        return date_val.startswith(f"{cur_y}-{cur_m}") or (cur_month_name in date_val and cur_y in date_val)
    
    df_curr = df_live[df_live.apply(is_in_cur, axis=1)]
    print(f"📊 Live Data ({cur_month_name} {cur_y}): {len(df_curr)} rows found.")

    # 3. Fetch MongoDB Stats
    print("📂 Fetching DASHBOARD data from MongoDB...")
    db = get_db()
    dept_sum = db["dept_summary"].find_one({"_id": "current_stats"})
    team_sums = db["team_summaries"].find_one({"_id": "current_stats"})
    
    if not dept_sum or not team_sums:
        print("⚠️ Warning: Dashboard summaries are empty. Please run sync first.")
        return
    
    # 4. Comparison - Global
    sheet_delivered = df_curr[df_curr['status'] == 'Delivered']['amount_x'].sum()
    db_delivered = dept_sum.get("achieved", 0.0)
    diff = abs(sheet_delivered - db_delivered)
    
    print("\n--- GLOBAL PARITY CHECK ---")
    print(f"Sheets Delivered:  ${sheet_delivered:,.2f}")
    print(f"MongoDB Delivered: ${db_delivered:,.2f}")
    if diff < 0.01:
        print("✅ SUCCESS: Global totals match perfectly.")
    else:
        print(f"❌ MISMATCH: Difference of ${diff:,.2f} detected.")

    # 5. Team Breakdown
    print("\n--- TEAM PARITY CHECK ---")
    teams_db = team_sums.get("teams", {})
    t_targets = TEAM_TARGETS()
    
    for tname in t_targets.keys():
        stats = teams_db.get(tname, {})
        db_amt = stats.get("deliveredAmt", 0.0)
        
        # Calculate from sheet
        norm_team = tname.lower().replace(" ","")
        if norm_team == "smm":
             t_df = df_curr[df_curr['del_by'].str.lower().str.replace("_","").str.replace(" ","").isin(["smm", "darkrankers"])]
        else:
             t_df = df_curr[df_curr['del_by'].str.lower().str.replace("_","").str.replace(" ","") == norm_team]
        
        sheet_amt = t_df[t_df['status'] == 'Delivered']['amount_x'].sum()
        
        status_icon = "✅" if abs(sheet_amt - db_amt) < 0.01 else "❌"
        print(f"{status_icon} {tname:15}: Sheets ${sheet_amt:10,.2f} | DB ${db_amt:10,.2f}")

    print("\n" + "-" * 50)
    print("Audit Complete.")

if __name__ == "__main__":
    run_audit()
