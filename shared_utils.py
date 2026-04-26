import os
import re
import json
import time
import urllib.request
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()

# ─── CONFIGURATION ──────────────────────────────────────────
SHEET_ID = os.getenv("SHEET_ID")
QUERY_SHEET_ID = os.getenv("QUERY_SHEET_ID", "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "seo_dashboard"

# Cache for dynamic config
_CONFIG_CACHE = {"data": None, "last_updated": 0}
CACHE_TTL = 300 # 5 minutes

def get_config():
    """Fetch configuration from MongoDB with caching."""
    curr_time = time.time()
    if _CONFIG_CACHE["data"] and (curr_time - _CONFIG_CACHE["last_updated"] < CACHE_TTL):
        return _CONFIG_CACHE["data"]
    
    try:
        db = get_db()
        config = db["config"].find_one({"_id": "app_settings"})
        if config:
            _CONFIG_CACHE["data"] = config
            _CONFIG_CACHE["last_updated"] = curr_time
            return config
    except Exception as e:
        print(f"Error fetching config: {e}")
        
    # Return default empty structure if DB fails and no cache exists
    return _CONFIG_CACHE["data"] or {
        "dept_target": 35000, 
        "member_target": 1100, 
        "team_targets": {}, 
        "management": {"manager": {}, "leaders": {}},
        "name_aliases": {}
    }

# Dynamic property helpers
def DEPT_TARGET(): return get_config().get("dept_target", 35000)
def MEM_TARGET(): return get_config().get("member_target", 1100)
def TEAM_TARGETS(): return get_config().get("team_targets", {})
def MANAGEMENT(): return get_config().get("management", {"manager": {}, "leaders": {}})
def NAME_ALIASES(): return get_config().get("name_aliases", {})

# Column indices (0-indexed)
COL = {
    "assign": 18,     # S
    "status": 19,     # T
    "service": 20,    # U
    "del_by": 21,     # V
    "del_date": 22,   # W
    "amount_x": 23,   # X
    "order_num": 13,  # N
    "order_link": 14, # O
    "client": 10,     # K
    "date": 3,        # D
    "profile": 6,     # G
    "instruction": 15,# P
}

# ─── DATABASE ───────────────────────────────────────────────
def get_db():
    client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    return client[DB_NAME]

# ─── UTILS ──────────────────────────────────────────────────
def parse_gviz_date(val):
    val_str = str(val)
    if val_str.startswith('Date(') and val_str.endswith(')'):
        try:
            parts = val_str[5:-1].split(',')
            y, m, d = int(parts[0]), int(parts[1]) + 1, int(parts[2])
            return f"{y:04d}-{m:02d}-{d:02d}"
        except:
            pass
    return val_str

def normalize_name(name):
    if not name: return ""
    name = re.sub(r"\([^)]*\)", "", str(name))
    name = name.replace("Ahmed ", "").replace("Md. ", "").replace("MD. ", "")
    return name.strip()

def normalize_assignee_token(token):
    token = re.sub(r"\([^)]*\)", "", token or "")
    token = re.sub(r"\b\d+%?\b", "", token)
    token = re.sub(r"%", "", token)
    token = re.sub(r"\s+", " ", token).strip(" -")
    return token.strip()

def safe_float(val):
    try:
        return float(str(val).replace("$", "").replace(",", "").strip())
    except:
        return 0.0

def fetch_sheet_data_gviz(sheet_name, sheet_id=None):
    if not sheet_id: sheet_id = SHEET_ID
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:json&sheet={sheet_name.replace(' ', '+')}&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return []
            raw_data = json.loads(match.group(1))
            rows_raw = raw_data['table']['rows']
            processed_rows = []
            for r in rows_raw:
                cells = r['c']
                row_vals = []
                if cells:
                    for c in cells:
                        val = ""
                        if c is not None:
                            if 'v' in c and c['v'] is not None:
                                val = parse_gviz_date(c['v'])
                            elif 'f' in c and c['f'] is not None:
                                val = str(c['f'])
                        row_vals.append(val)
                processed_rows.append(row_vals)
            return processed_rows
    except Exception as e:
        print(f"Error fetching sheet {sheet_name}: {e}")
        return []

def get_members_from_db():
    try:
        db = get_db()
        members = list(db["members"].find({}, {"_id": 0}))
        return members
    except Exception as e:
        print(f"Error fetching members from DB: {e}")
        return []
