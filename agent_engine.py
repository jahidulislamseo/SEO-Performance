import os
import re
import time
import json
import urllib.request
import pandas as pd
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from shared_utils import (
    SHEET_ID, MONGO_URI, DB_NAME, DEPT_TARGET, MEM_TARGET, TEAM_TARGETS, MANAGEMENT, NAME_ALIASES, COL,
    get_db, parse_gviz_date, normalize_name, safe_float, fetch_sheet_data_gviz
)

# Use gspread if available for better reliability
try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
except ImportError:
    gspread = None

def fetch_data_gspread(sheet_name):
    """Fetcher using gspread and Service Account."""
    if not gspread: return None
    try:
        scope = ["https://spreadsheets.google.com/feeds", 'https://www.googleapis.com/auth/drive']
        creds_path = os.path.join(os.path.dirname(__file__), 'creds.json')
        if not os.path.exists(creds_path):
            print("Warning: creds.json not found. Falling back to Gviz.")
            return None
        creds = ServiceAccountCredentials.from_json_keyfile_name(creds_path, scope)
        client = gspread.authorize(creds)
        sheet = client.open_by_key(SHEET_ID).worksheet(sheet_name)
        return sheet.get_all_values()
    except Exception as e:
        print(f"Gspread Error: {e}")
        return None

def get_raw_dataframe():
    """Fetches Kam Data and returns a cleaned Pandas DataFrame."""
    print("Fetching raw data...")
    # Try Gspread first
    raw_rows = fetch_data_gspread("Kam Data")
    if not raw_rows:
        raw_rows = fetch_sheet_data_gviz("Kam Data")
        if not raw_rows: return pd.DataFrame()
        # Gviz rows already processed, just wrap in DF
        df = pd.DataFrame(raw_rows)
    else:
        # Gspread returns actual string values
        df = pd.DataFrame(raw_rows)
        # Handle header if first row is names
        if df.iloc[0, 0] == "ID": # Simple heuristic
             df.columns = df.iloc[0]
             df = df.drop(df.index[0])
    
    # Standardize columns based on our index map
    # We create a mapping of index to our named columns
    col_map = {v: k for k, v in COL.items()}
    df = df.rename(columns=lambda x: col_map.get(x, x) if isinstance(x, int) else x)
    
    # If columns were strings from Gspread, we might need a manual rename based on position
    if "assign" not in df.columns:
        # Ensure we have enough columns
        for name, idx in COL.items():
            if idx < len(df.columns):
                df.rename(columns={df.columns[idx]: name}, inplace=True)
                
    return df

# ─── MAIN ENGINE ──────────────────────────────────────

def calculate_summaries():
    print(f"Pandas Logic Engine Started: {time.ctime()}")
    
    # 1. Initialize MongoDB
    db = get_db()
    
    # 2. Get Data
    df = get_raw_dataframe()
    if df.empty:
        print("Error: Could not fetch data.")
        return

    # 3. LIFETIME BACKUP: Archiving all data to MongoDB before filtering
    backup_to_db(df, db)

    process_and_save(df, db)

def backup_to_db(df, db):
    """Saves every unique project from the sheet into a permanent archive using Bulk Operations."""
    if df.empty: return
    print(f"Archiving {len(df)} rows to permanent database...")
    
    from pymongo import UpdateOne
    operations = []
    
    for _, row in df.iterrows():
        p = row.to_dict()
        order_num = str(p.get('order_num', '')).strip()
        if not order_num or order_num == 'N/A' or order_num == 'None': continue
        
        # Ensure we have a valid month bucket (YYYY-MM)
        project_date = p.get("date") or p.get("del_date") or ""
        month_bucket = project_date[:7] if len(str(project_date)) >= 7 else "Unknown"

        doc = {
            "order": order_num,
            "client": p.get("client"),
            "service": p.get("service"),
            "status": p.get("status"),
            "amtX": safe_float(p.get("amount_x")),
            "date": project_date,
            "month": month_bucket,
            "deliveredDate": p.get("del_date"),
            "assign": p.get("assign"),
            "team": p.get("op_dept"),
            "link": p.get("order_link"),
            "instruction": p.get("instruction"),
            "profile": p.get("profile"),
            "last_seen": time.time()
        }
        
        operations.append(
            UpdateOne({"order": order_num}, {"$set": doc}, upsert=True)
        )
    
    if operations:
        try:
            result = db["projects_archive"].bulk_write(operations, ordered=False)
            print(f"Archive Update Complete: {result.upserted_count} new, {result.modified_count} updated.")
        except Exception as e:
            print(f"Bulk Write Error: {e}")

def process_and_save(df, db):
    # 1. Get Members
    members_list = list(db["members"].find({}, {"_id": 0}))
    if not members_list:
        print("Error: No members found in DB.")
        return
    
    member_lookup = {m["name"].strip().lower(): m["name"] for m in members_list}
    # Add manual aliases from DB for matching accuracy
    aliases = NAME_ALIASES()
    for alias, official in aliases.items():
        member_lookup[alias.lower()] = official

    # 2. Clean & Filter
    # Ensure amount is float
    def clean_amt(val):
        try: return float(str(val).replace("$","").replace(",","").strip())
        except: return 0.0
    
    if 'amount_x' in df.columns:
        df['amount_x'] = df['amount_x'].apply(clean_amt)
    
    # Filter for SEO/SMM
    if 'service' in df.columns:
        df = df[df['service'].str.contains('SEO|SMM', case=False, na=False)]

    # ─── DATE FILTERING (Dynamic Month) ───
    cur_y = time.strftime("%Y")
    cur_m = time.strftime("%m").lstrip('0') # Support both 04 and 4
    cur_m_padded = time.strftime("%m")
    cur_month_name = time.strftime("%B")
    
    def is_in_current_month(row):
        status = str(row.get('status', '')).strip()
        date_val = str(row.get('del_date', '')) if status == 'Delivered' else str(row.get('date', ''))
        if not date_val: return False
        
        # Match YYYY-MM or YYYY-M
        if date_val.startswith(f"{cur_y}-{cur_m_padded}") or date_val.startswith(f"{cur_y}-{cur_m}-"):
            return True
        # Match Month YYYY
        if cur_month_name in date_val and cur_y in date_val:
            return True
        # Match MM/DD/YYYY or M/D/YYYY
        if re.search(fr"^{cur_m_padded}/", date_val) and f"/{cur_y}" in date_val:
            return True
        if re.search(fr"^{cur_m}/", date_val) and f"/{cur_y}" in date_val:
            return True
            
        return False
            
    df = df[df.apply(is_in_current_month, axis=1)]
    print(f"Rows after month filter ({cur_month_name} {cur_y}): {len(df)}")

    # 3. Process Assignees and Splits
    expanded_rows = []
    for _, row in df.iterrows():
        assign_text = str(row.get('assign', ''))
        status = str(row.get('status', '')).strip()
        amt_x = row.get('amount_x', 0.0)
        
        # Parse names
        parts = [p.strip() for p in re.split(r"[/,]", assign_text)]
        found_names = []
        unique_tokens = set()
        for p in parts:
            tk = normalize_name(p).lower()
            if tk: unique_tokens.add(tk)
            if tk in member_lookup:
                found_names.append(member_lookup[tk])
        
        found_names = list(set(found_names))
        num_assigned = len(unique_tokens) if unique_tokens else 1
        share_x = round(amt_x / num_assigned, 2)
        
        for name in found_names:
            new_row = row.to_dict()
            new_row['matched_name'] = name
            new_row['share'] = share_x
            expanded_rows.append(new_row)

    edf = pd.DataFrame(expanded_rows)
    
    # 4. Global Stats
    print("Calculating Global stats...")
    total_delivered_amt = df[df['status'] == 'Delivered']['amount_x'].sum() if not df.empty else 0
    total_wip_amt = df[df['status'].isin(['WIP', 'Revision'])]['amount_x'].sum() if not df.empty else 0
    unique_projects = df[df['order_num'].str.strip() != "N/A"]['order_num'].nunique() if not df.empty else 0
    
    # Audit counts for the current month (Unique by Order Number)
    seoSmmRows = len(df)
    deliveredRows = df[df['status'] == 'Delivered']['order_num'].nunique()
    wipRows = df[df['status'].isin(['WIP', 'Revision'])]['order_num'].nunique()
    cancelledRows = df[df['status'] == 'Cancelled']['order_num'].nunique()
    matchedRows = edf['order_num'].nunique() if not edf.empty else 0
    unmatchedRows = seoSmmRows - (df[df['order_num'].isin(edf['order_num'])]['order_num'].nunique() if not edf.empty else 0)

    # 5. Member Stats
    print("Calculating Member stats...")
    member_summaries = []
    for m in members_list:
        name = m["name"]
        m_df = edf[edf['matched_name'] == name] if not edf.empty else pd.DataFrame()
        
        if not m_df.empty:
            delivered = m_df[m_df['status'] == 'Delivered']
            wip_rev = m_df[m_df['status'].isin(['WIP', 'Revision'])]
            
            s = {
                "name": name, "fullName": m["fullName"], "team": m["team"], "id": m.get("id",""),
                "role": m.get("role", "Member"),
                "email": m.get("email", ""),
                "phone": m.get("phone", ""),
                "joinDate": m.get("joinDate", ""),
                "manager": m.get("manager", "Mehedi Hassan"),
                "target": MEM_TARGET(),
                "total": len(m_df),
                "delivered": len(delivered),
                "wip": len(m_df[m_df['status'] == 'WIP']),
                "revision": len(m_df[m_df['status'] == 'Revision']),
                "cancelled": len(m_df[m_df['status'] == 'Cancelled']),
                "deliveredAmt": round(delivered['share'].sum(), 2),
                "wipAmt": round(wip_rev['share'].sum(), 2),
                "projects": []
            }
            
            for _, p in m_df.iterrows():
                s["projects"].append({
                    "order": p.get("order_num"), "status": p.get("status"), 
                    "amtX": p.get("amount_x"), "share": p.get("share"),
                    "client": p.get("client"), "date": p.get("date"),
                    "deliveredBy": p.get("del_by"), "deliveredDate": p.get("del_date"),
                    "assign": p.get("assign"), "service": p.get("service"),
                    "link": p.get("order_link"),
                    "instruction": p.get("instruction"),
                    "profile": p.get("profile")
                })
        else:
            s = {
                "name": name, "fullName": m["fullName"], "team": m["team"], "id": m.get("id",""),
                "target": MEM_TARGET(), "total": 0, "delivered": 0, "wip": 0, "revision": 0,
                "cancelled": 0, "deliveredAmt": 0.0, "wipAmt": 0.0, "projects": []
            }
        
        s["remaining"] = round(s["deliveredAmt"] - s["target"], 2)
        s["progress"] = round((s["deliveredAmt"] / s["target"]) * 100, 1) if s["target"] else 0
        member_summaries.append(s)

    # 6. Team Stats
    print("Calculating Team stats...")
    team_data = {}
    targets = TEAM_TARGETS()
    mgmt = MANAGEMENT()
    for team in targets.keys():
        team_members = [s for s in member_summaries if s['team'] == team]
        delivered_amt = sum(m['deliveredAmt'] for m in team_members)
        wip_amt = sum(m['wipAmt'] for m in team_members)
        total_projects = sum(m['total'] for m in team_members)
        delivered_count = sum(m['delivered'] for m in team_members)
        wip_count = sum(m['wip'] for m in team_members)
        revision_count = sum(m['revision'] for m in team_members)
        cancelled_count = sum(m['cancelled'] for m in team_members)

        team_data[team] = {
            "leader": mgmt["leaders"].get(team, {}).get("name", "N/A"),
            "amt": round(delivered_amt, 2),
            "deliveredAmt": round(delivered_amt, 2),
            "wipAmt": round(wip_amt, 2),
            "projects": total_projects,
            "delivered": delivered_count,
            "wip": wip_count,
            "revision": revision_count,
            "cancelled": cancelled_count,
            "target": targets.get(team, 0)
        }

    # 7. Save to MongoDB
    print("Saving to MongoDB...")
    db["member_summaries"].delete_many({})
    if member_summaries: db["member_summaries"].insert_many(member_summaries)
    
    db["team_summaries"].delete_many({})
    db["team_summaries"].insert_one({"_id": "current_stats", "teams": team_data})
    
    db["dept_summary"].delete_many({})
    db["dept_summary"].insert_one({
        "_id": "current_stats",
        "target": DEPT_TARGET(),
        "achieved": round(total_delivered_amt, 2),
        "wipAmt": round(total_wip_amt, 2),
        "uniqueProjects": unique_projects,
        "seoSmmRows": seoSmmRows,
        "matchedRows": matchedRows,
        "deliveredRows": deliveredRows,
        "wipRows": wipRows,
        "cancelledRows": cancelledRows,
        "unmatchedRows": unmatchedRows,
        "last_updated": time.time()
    })
    
    print("Logic Execution Complete.")

if __name__ == "__main__":
    calculate_summaries()
