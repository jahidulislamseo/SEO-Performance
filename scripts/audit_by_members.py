import os
import re
import json
import urllib.request
import time
from dotenv import load_dotenv

load_dotenv()

SHEET_ID = os.getenv("SHEET_ID")
COL_DATE = 3
COL_STATUS = 19
COL_ASSIGN = 18

GEO_MEMBERS = ["Jahidul", "Sabit", "Komal", "Hasibul", "Shourav", "Roni"]

def normalize_assignee_token(token):
    token = re.sub(r"\([^)]*\)", "", token or "")
    token = re.sub(r"\b\d+%?\b", "", token)
    token = re.sub(r"\s+", " ", token).strip(" -")
    return token.strip().lower()

def audit_by_members():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return
            raw_data = json.loads(match.group(1))
            rows = raw_data['table']['rows']
            
            geo_rows = []
            for r in rows:
                cells = r['c']
                if not cells: continue
                def get_val(idx):
                    if idx < len(cells) and cells[idx] and 'v' in cells[idx]:
                        return cells[idx]['v']
                    return ""
                
                date_str = str(get_val(COL_DATE))
                # Check for Date(2026,3,...) which is April (0-indexed)
                if "Date(2026,3," not in date_str: continue
                
                assign = str(get_val(COL_ASSIGN))
                status = str(get_val(COL_STATUS)).strip()
                
                parts = [p.strip() for p in re.split(r"[/,]", assign)]
                is_geo = False
                for p in parts:
                    token = normalize_assignee_token(p)
                    for m in GEO_MEMBERS:
                        if m.lower() in token:
                            is_geo = True
                            break
                    if is_geo: break
                
                if is_geo:
                    geo_rows.append(status)
            
            print(f"Stats for GEO Members in April 2026:")
            print(f"Total rows: {len(geo_rows)}")
            from collections import Counter
            counts = Counter(geo_rows)
            for s, c in counts.items():
                print(f"  {s}: {c}")
                
    except Exception as e:
        print(f"Error: {e}")

audit_by_members()
