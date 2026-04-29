import os
import pandas as pd
from shared_utils import fetch_sheet_data_gviz, get_db, COL
import agent_engine

def compare():
    print("Fetching LIVE data from Google Sheets...")
    rows = fetch_sheet_data_gviz("Kam Data")
    if not rows:
        print("Failed to fetch live data.")
        return
        
    # Convert to DataFrame
    df_live = pd.DataFrame(rows)
    # Rename columns to match COL mapping
    cols_to_use = {v: k for k, v in COL.items()}
    df_live = df_live.rename(columns=cols_to_use)
    
    # Run calculation logic on LIVE data
    print("Processing LIVE data logic...")
    db = get_db()
    # We won't save, just calculate in memory if possible or use a temp collection
    # For now, let's just trigger a full sync to DB and check the results
    agent_engine.calculate_summaries()
    
    # Fetch results from DB
    dept = db["dept_summary"].find_one({"_id": "current_stats"})
    teams = db["team_summaries"].find_one({"_id": "current_stats"})["teams"]
    
    print("\n--- LIVE SHEET SUMMARY (April 2026) ---")
    print(f"Total Achieved: ${dept['achieved']:,.2f}")
    for tname, stats in teams.items():
        print(f"{tname:15}: ${stats['deliveredAmt']:,.2f} ({stats['delivered']} deliveries)")
    print("---------------------------------------\n")

if __name__ == "__main__":
    compare()
