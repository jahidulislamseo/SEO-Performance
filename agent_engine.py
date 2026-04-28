import os
import re
import time
import json
import urllib.request
import logging
import pandas as pd
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from shared_utils import (
    SHEET_ID, MONGO_URI, DB_NAME, DEPT_TARGET, MEM_TARGET, TEAM_TARGETS, MANAGEMENT, NAME_ALIASES, COL,
    get_db, parse_gviz_date, normalize_name, safe_float, fetch_sheet_data_gviz
)

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    try:
        logger.info("Fetching raw data from Google Sheets...")
        raw_rows = fetch_data_gspread("Kam Data") or fetch_sheet_data_gviz("Kam Data")
        
        if not raw_rows:
            logger.error("No data retrieved from Google Sheets.")
            return pd.DataFrame()

        df = pd.DataFrame(raw_rows)
        if df.iloc[0, 0] == "ID": # Header logic
            df.columns = df.iloc[0]
            df = df.drop(df.index[0])
        
        # Standardize columns using COL mapping
        col_map = {v: k for k, v in COL.items()}
        df = df.rename(columns=lambda x: col_map.get(x, x) if isinstance(x, int) else x)

        if "assign" not in df.columns:
            for name, idx in COL.items():
                if idx < len(df.columns):
                    df.rename(columns={df.columns[idx]: name}, inplace=True)
                    
        return df
    except Exception as e:
        logger.exception(f"Critical error in get_raw_dataframe: {e}")
        return pd.DataFrame()

# ─── MAIN ENGINE ──────────────────────────────────────

def calculate_summaries():
    logger.info("Pandas Logic Engine Started.")
    try:
        db = get_db()
        df = get_raw_dataframe()
        if df.empty:
            logger.warning("Empty DataFrame, skipping processing.")
            return

        backup_to_db(df, db)
        process_and_save(df, db)
        logger.info("Logic Execution Complete Successfully.")
    except Exception as e:
        logger.error(f"Calculation Engine Failed: {e}", exc_info=True)

def backup_to_db(df, db):
    """Saves every unique project from the sheet into a permanent archive using Bulk Operations."""
    if df.empty: return
    try:
        logger.info(f"Archiving {len(df)} rows...")
        from pymongo import UpdateOne
        operations = []
        
        for _, row in df.iterrows():
            p = row.to_dict()
            order_num = str(p.get('order_num', '')).strip()
            if not order_num or order_num.lower() in ['n/a', 'none', '']: continue
            
            project_date = str(p.get("date") or p.get("del_date") or "")
            month_bucket = project_date[:7] if len(project_date) >= 7 else "Unknown"

            doc = {
                "order": order_num, "client": p.get("client"), "service": p.get("service"),
                "status": p.get("status"), "amtX": safe_float(p.get("amount_x")),
                "date": project_date, "month": month_bucket, "deliveredDate": p.get("del_date"),
                "assign": p.get("assign"), "team": p.get("op_dept"), "link": p.get("order_link"),
                "instruction": p.get("instruction"), "profile": p.get("profile"), "last_seen": time.time()
            }
            operations.append(UpdateOne({"order": order_num}, {"$set": doc}, upsert=True))
        
        if operations:
            result = db["projects_archive"].bulk_write(operations, ordered=False)
            logger.info(f"Archive Update: {result.upserted_count} new, {result.modified_count} updated.")
    except Exception as e:
        logger.error(f"Bulk Write Error during archive: {e}")

def process_and_save(df, db):
    # 1. Get Members
    try:
        members_list = list(db["members"].find({}, {"_id": 0}))
        if not members_list: raise ValueError("No members found in DB.")
    except Exception as e:
        logger.error(f"Member fetch failed: {e}")
        return

    member_lookup = {m["name"].strip().lower(): m["name"] for m in members_list}
    aliases = NAME_ALIASES()
    for alias, official in aliases.items():
        member_lookup[alias.lower()] = official

    def clean_amt(val):
        if pd.isna(val) or val == '': return 0.0
        try: 
            return float(str(val).replace("$","").replace(",","").strip())
        except ValueError:
            logger.warning(f"Invalid amount format: {val}")
            return 0.0
    
    if 'amount_x' in df.columns:
        df['amount_x'] = df['amount_x'].apply(clean_amt).fillna(0.0)
    
    # Filter for SEO/SMM
    if 'service' in df.columns:
        df = df[df['service'].str.contains('SEO|SMM', case=False, na=False)]

    # ─── DATE FILTERING (Dynamic Month) ───
    cur_y = time.strftime("%Y")
    cur_m_padded = time.strftime("%m")

    # Helper to clean date strings and prioritize delivery date for delivered items
    df['calc_date_str'] = df.apply(lambda r: str(r.get('del_date', '')) if str(r.get('status')).strip() == 'Delivered' else str(r.get('date', '')), axis=1)
    df['calc_date'] = pd.to_datetime(df['calc_date_str'], errors='coerce')
    
    # Filter only for the current month
    current_start = pd.Timestamp(f"{cur_y}-{cur_m_padded}-01")
    next_month = current_start + pd.offsets.MonthBegin(1)
    df = df[(df['calc_date'] >= current_start) & (df['calc_date'] < next_month)].copy()
    
    logger.info(f"Rows after current month filter: {len(df)}")

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
    logger.info("Calculating Global stats...")
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
    logger.info("Calculating Member stats...")
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
    logger.info("Calculating Team stats...")
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
    logger.info("Saving processed results to MongoDB...")
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

if __name__ == "__main__":
    calculate_summaries()
