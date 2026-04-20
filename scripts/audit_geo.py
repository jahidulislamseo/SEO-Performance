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
COL_OP_DEPT = 26

def parse_gviz_date(val_str):
    if val_str.startswith('Date(') and val_str.endswith(')'):
        try:
            parts = val_str[5:-1].split(',')
            y, m, d = int(parts[0]), int(parts[1]) + 1, int(parts[2])
            return f"{y:04d}-{m:02d}-{d:02d}"
        except: pass
    return val_str

def audit_geo_rankers():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return
            raw_data = json.loads(match.group(1))
            rows = raw_data['table']['rows']
            
            april_geo_rows = []
            for r in rows:
                cells = r['c']
                if not cells: continue
                # Get vals safely
                def get_val(idx):
                    if idx < len(cells) and cells[idx] and 'v' in cells[idx]:
                        return cells[idx]['v']
                    return ""
                
                date_raw = get_val(COL_DATE)
                status = str(get_val(COL_STATUS)).strip()
                op_dept = str(get_val(COL_OP_DEPT)).strip()
                
                date_str = parse_gviz_date(str(date_raw))
                
                # Check for April 2026
                if date_str.startswith("2026-04") and op_dept == "Geo_Rankers":
                    april_geo_rows.append(status)
            
            print(f"Total rows for Geo_Rankers in April 2026: {len(april_geo_rows)}")
            from collections import Counter
            counts = Counter(april_geo_rows)
            for status, count in counts.items():
                print(f"{status}: {count}")
                
    except Exception as e:
        print(f"Error: {e}")

audit_geo_rankers()
