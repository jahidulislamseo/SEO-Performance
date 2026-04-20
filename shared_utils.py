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
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "seo_dashboard"

DEPT_TARGET = 36000
MEM_TARGET = 1100

TEAM_TARGETS = {
    "GEO Rankers": 6000,
    "Rank Riser": 12000,
    "Search Apex": 9000,
    "SMM": 7700,
}

MANAGEMENT = {
    "manager": {"name": "Mehedi Hassan", "title": "Project Manager"},
    "leaders": {
        "GEO Rankers": {"name": "Md. Jahidul Islam", "title": "Team Leader"},
        "Rank Riser": {"name": "Gazi Fahim Hasan", "title": "Team Leader"},
        "Search Apex": {"name": "Shihadul Islam Tihim", "title": "Team Leader"},
        "SMM": {"name": "Istiak", "title": "Team Leader"},
    }
}

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

def fetch_sheet_data_gviz(sheet_name):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={sheet_name.replace(' ', '+')}&t={int(time.time())}"
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
