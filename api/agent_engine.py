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
    get_db, parse_gviz_date, normalize_name, normalize_assignee_token, safe_float, fetch_sheet_data_gviz
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
            
            # User requested Date column to strictly show Column D (date)
            order_date = str(p.get("date") or "").strip()
            # We still need a date for the month bucket, fallback to del_date if order_date is missing
            bucket_date = order_date if order_date else str(p.get("del_date") or "")
            
            # Roll over last day of month to next month
            try:
                dt = pd.to_datetime(bucket_date, errors='coerce')
                if pd.notna(dt) and dt.is_month_end:
                    dt += pd.Timedelta(days=1)
                month_bucket = dt.strftime("%Y-%m") if pd.notna(dt) else "Unknown"
            except:
                month_bucket = bucket_date[:7] if len(bucket_date) >= 7 else "Unknown"

            doc = {
                "order": order_num, "client": p.get("client"), "service": p.get("service"),
                "status": p.get("status"), "amtX": safe_float(p.get("amount_x")),
                "date": order_date, "month": month_bucket, "deliveredDate": p.get("del_date"),
                "assign": p.get("assign"), "team": p.get("op_dept"), "link": p.get("order_link"),
                "instruction": p.get("instruction"), "profile": p.get("profile"), 
                "deadline": p.get("deadline"), 
                "delLastTime": p.get("del_last_time") if p.get("del_last_time") else p.get("del_date"),
                "last_seen": time.time()
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

    # Use order date (col D) for all rows — delivery dates can be future months
    # so filtering by del_date would exclude May orders still in WIP/pending delivery
    df['calc_date'] = pd.to_datetime(df['date'].astype(str), errors='coerce')
    
    # Roll over last day of month to the 1st of the next month
    mask_last_day = df['calc_date'].dt.is_month_end
    df.loc[mask_last_day, 'calc_date'] = df.loc[mask_last_day, 'calc_date'] + pd.Timedelta(days=1)
    
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
            tk = normalize_assignee_token(p).lower()
            if not tk: continue
            unique_tokens.add(tk)
            
            # 100% Accuracy Fix: Auto-register or match
            official_name = member_lookup.get(tk)
            if not official_name:
                # Auto-create member in DB if not exists
                official_name = tk.strip().title()
                db["members"].update_one(
                    {"name": official_name},
                    {"$setOnInsert": {"team": "Guest", "role": "Member", "id": f"AUTO-{tk.upper()[:3]}", "isOfficial": False}},
                    upsert=True
                )
                member_lookup[tk] = official_name
                logger.info(f"Auto-registered member: {official_name}")
            
            found_names.append(official_name)
        
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
    total_revision_amt = df[df['status'] == 'Revision']['amount_x'].sum() if not df.empty else 0
    total_cancelled_amt = df[df['status'] == 'Cancelled']['amount_x'].sum() if not df.empty else 0
    unique_projects = df[df['order_num'].str.strip() != "N/A"]['order_num'].nunique() if not df.empty else 0
    
    # Audit counts for the current month (Unique by Order Number)
    seoSmmRows = len(df)
    deliveredRows = df[df['status'] == 'Delivered']['order_num'].nunique()
    wipRows = df[df['status'].isin(['WIP', 'Revision'])]['order_num'].nunique()
    cancelledRows = df[df['status'] == 'Cancelled']['order_num'].nunique()
    matchedRows = edf['order_num'].nunique() if not edf.empty else 0
    unmatchedRows = seoSmmRows - (df[df['order_num'].isin(edf['order_num'])]['order_num'].nunique() if not edf.empty else 0)

    # Platform Breakdown (Current Month)
    platform_stats = {"Fiverr": 0.0, "Upwork": 0.0, "B2B": 0.0, "PPH": 0.0}
    if not df.empty:
        delivered_df = df[df['status'] == 'Delivered']
        for _, p in delivered_df.iterrows():
            prof = str(p.get('profile', '')).lower()
            amt = safe_float(p.get('amount_x'))
            if 'fiverr' in prof: platform_stats["Fiverr"] += amt
            elif 'upwork' in prof: platform_stats["Upwork"] += amt
            elif 'pph' in prof: platform_stats["PPH"] += amt
            else: platform_stats["B2B"] += amt
    
    platform_stats = {k: round(v, 2) for k, v in platform_stats.items()}

    # 5. Member Stats
    logger.info("Calculating Member stats and Attendance for official members only...")
    
    # Filter for official members only
    members_list = list(db["members"].find({"isOfficial": True}, {"_id": 0}))
    
    # Fetch current month attendance
    from datetime import datetime, timedelta, timezone
    tz_bd = timezone(timedelta(hours=6))
    now_bd = datetime.now(tz_bd)
    cur_month_prefix = now_bd.strftime("%Y-%m")
    
    attendance_records = list(db["attendance"].find({
        "date": {"$regex": f"^{cur_month_prefix}"}
    }))
    
    def _cid(v):
        s = str(v) if v is not None else ""
        return s[:-2] if s.endswith(".0") else s

    member_summaries = []
    members_coll = db["members"]
    # Robust profile map
    profiles_by_id = {}
    for p in members_coll.find({}, {"_id": 0, "id": 1, "avatar": 1, "fullName": 1}):
        if p.get("id"):
            profiles_by_id[_cid(p["id"])] = p

    for m in members_list:
        name = m["name"]
        emp_id = m.get("id", "")
        # Fetch profile for extra fields (avatar, fullName)
        prof = profiles_by_id.get(_cid(emp_id)) or {}
        m_df = edf[edf['matched_name'] == name] if not edf.empty else pd.DataFrame()
        
        # Filter attendance for this member
        m_att = [r for r in attendance_records if str(r.get("emp_id", "")).rstrip(".0") == str(emp_id).rstrip(".0")]
        late_count = sum(1 for r in m_att if r.get("status") == "Late")
        present_count = sum(1 for r in m_att if r.get("status") == "Present")
        
        # Each member has their own weekly off day (default: Friday=4)
        # 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
        off_day = m.get("offDay", 4)  # Default Friday
        
        # Count past working days this month (exclude today and member's off day)
        today_day = now_bd.day
        working_days_elapsed = 0
        for day_num in range(1, today_day):   # exclude today itself
            weekday = now_bd.replace(day=day_num).weekday()
            if weekday != off_day:
                working_days_elapsed += 1
        
        total_checked_in = late_count + present_count
        absent_count = max(0, working_days_elapsed - total_checked_in)
        in_time_count = present_count          # On-time only (no Late)
        checked_in_count = total_checked_in    # Total days present (Present + Late)
        
        if not m_df.empty:
            delivered = m_df[m_df['status'] == 'Delivered']
            wip_rev = m_df[m_df['status'].isin(['WIP', 'Revision'])]
            
            team_name = m.get("team", "GEO Rankers")
            if team_name == "SMM": team_name = "Dark Rankers"
            s = {
                "name": name, "fullName": m.get("fullName", name), "team": team_name, "id": emp_id,
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
                "lateCount": late_count,
                "absentCount": absent_count,
                "inTimeCount": in_time_count,
                "presentCount": checked_in_count,
                "projects": []
            }
            
            for _, p in m_df.iterrows():
                order_num = p.get("order_num")
                s["projects"].append({
                    "order": order_num, "status": p.get("status"), 
                    "amtX": p.get("amount_x"), "share": p.get("share"),
                    "client": p.get("client"), "date": p.get("date"),
                    "deliveredBy": p.get("del_by"), "deliveredDate": p.get("del_date"),
                    "assign": p.get("assign"), "service": p.get("service"),
                    "link": p.get("order_link"),
                    "instruction": p.get("instruction"),
                    "deadline": p.get("deadline"),
                    "delLastTime": p.get("del_date"), # Prioritize DELIVERED column for countdown
                    "profile": p.get("profile")
                })
        else:
            team_name = m.get("team", "GEO Rankers")
            if team_name == "SMM": team_name = "Dark Rankers"
            s = {
                "name": name, "fullName": m.get("fullName", name), "team": team_name, "id": emp_id,
                "target": MEM_TARGET(), "total": 0, "delivered": 0, "wip": 0, "revision": 0,
                "cancelled": 0, "deliveredAmt": 0.0, "wipAmt": 0.0, 
                "lateCount": late_count, "absentCount": absent_count, "inTimeCount": in_time_count,
                "presentCount": checked_in_count,
                "projects": []
            }
        
        # Merge avatar and fullName if exists in profile
        if prof.get("avatar"):
            s["avatar"] = prof["avatar"]
        if prof.get("fullName"):
            s["fullName"] = prof["fullName"]
        
        # ─── Performance Scoring Logic ───
        # Factors: 
        # 1. Delivery vs Target (Weight 50)
        # 2. Present Days (Weight 20)
        # 3. Late Days (Penalty -5 each)
        # 4. Absent Days (Penalty -10 each)
        # 5. Cancelled Projects (Penalty -15 each)
        
        target_val = s["target"] or 1100
        delivery_score = (s["deliveredAmt"] / target_val) * 50
        attendance_score = (s["presentCount"] * 1) # reduced weight for now
        # Reduced penalties for now until everyone uses the portal
        penalty_score = (s["lateCount"] * 1) + (absent_count * 0) + (s["cancelled"] * 5)
        
        s["performanceScore"] = round(max(0, delivery_score + attendance_score - penalty_score), 1)
        s["remaining"] = round(s["deliveredAmt"] - s["target"], 2)
        s["progress"] = round((s["deliveredAmt"] / s["target"]) * 100, 1) if s["target"] else 0
        member_summaries.append(s)

    # 6. Team Stats
    logger.info("Calculating Team stats (using Op. Department tags)...")
    team_data = {}
    targets = TEAM_TARGETS()
    print(f"DEBUG TEAM_TARGETS: {targets}")
    mgmt = MANAGEMENT()
    
    # Mapping for sheet tags
    TEAM_TAG_MAP = {
        "GEO Rankers": "Geo_Rankers",
        "Rank Riser": "Rank_Riser",
        "Search Apex": "Search_Apex",
        "Dark Rankers": "Dark_Rankers"
    }

    logger.info(f"Team targets from config: {targets}")
    for team in targets.keys():
        tag = TEAM_TAG_MAP.get(team, team.replace(" ", "_"))
        
        # Filter original dataframe for this team's tag in op_dept
        t_df = df[df['op_dept'].astype(str).str.strip().str.lower() == tag.lower()]
        
        delivered = t_df[t_df['status'] == 'Delivered']
        wip_rev = t_df[t_df['status'].isin(['WIP', 'Revision'])]
        
        team_data[team] = {
            "name": team,
            "leader": mgmt["leaders"].get(team, {}).get("name", "N/A"),
            "amt": round(delivered['amount_x'].sum(), 2),
            "deliveredAmt": round(delivered['amount_x'].sum(), 2),
            "wipAmt": round(wip_rev['amount_x'].sum(), 2),
            "projects": len(t_df),
            "delivered": len(delivered),
            "wip": len(t_df[t_df['status'] == 'WIP']),
            "revision": len(t_df[t_df['status'] == 'Revision']),
            "cancelled": len(t_df[t_df['status'] == 'Cancelled']),
            "target": targets.get(team, 0),
            "remaining": round(targets.get(team, 0) - round(delivered['amount_x'].sum(), 2), 2),
            "progress": round((round(delivered['amount_x'].sum(), 2) / targets.get(team, 0)) * 100, 1) if targets.get(team, 0) else 0
        }

    # 7. Save to MongoDB
    logger.info("Saving processed results to MongoDB...")
    db["member_summaries"].delete_many({})
    if member_summaries: db["member_summaries"].insert_many(member_summaries)
    
    db["team_summaries"].delete_many({})
    db["team_summaries"].insert_one({"_id": "current_stats", "teams": team_data})
    
    # Calculate Today's Attendance for Dept Summary
    today_str = now_bd.strftime("%Y-%m-%d")
    today_att = [r for r in attendance_records if r.get("date") == today_str]
    total_checked_in = len(today_att)
    total_late_today = sum(1 for r in today_att if r.get("status") == "Late")
    total_present_today = sum(1 for r in today_att if r.get("status") == "Present")
    total_absent_today = max(0, len(members_list) - total_checked_in)

    db["dept_summary"].delete_many({})
    db["dept_summary"].insert_one({
        "_id": "current_stats",
        "target": DEPT_TARGET(),
        "achieved": round(total_delivered_amt, 2),
        "wipAmt": round(total_wip_amt, 2),
        "revisionAmt": round(total_revision_amt, 2),
        "cancelledAmt": round(total_cancelled_amt, 2),
        "uniqueProjects": unique_projects,
        "seoSmmRows": seoSmmRows,
        "matchedRows": matchedRows,
        "delivered": deliveredRows, # Unified key for audit
        "wip": wipRows,
        "revision": df[df['status'] == 'Revision']['order_num'].nunique() if not df.empty else 0,
        "cancelled": cancelledRows,
        "matchedRows": matchedRows,
        "deliveredRows": deliveredRows,
        "wipRows": wipRows,
        "cancelledRows": cancelledRows,
        "unmatchedRows": unmatchedRows,
        "platformStats": platform_stats,
        "presentToday": total_present_today,
        "lateToday": total_late_today,
        "absentToday": total_absent_today,
        "bestPerformer": sorted(member_summaries, key=lambda x: x['deliveredAmt'], reverse=True)[0] if member_summaries else None,
        "bestTeam": sorted(team_data.values(), key=lambda x: x['deliveredAmt'], reverse=True)[0] if team_data else None,
        "name": "GEO Rankers",
        "last_updated": time.time()
    })

if __name__ == "__main__":
    calculate_summaries()
