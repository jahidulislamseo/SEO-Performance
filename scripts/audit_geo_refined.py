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
            # NOTE: Google visualization months are 0-indexed. April is 3.
            y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
            return f"{y:04d}-{m+1:02d}-{d:02d}"
        except: pass
    return val_str

def audit_unique_tags():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return
            raw_data = json.loads(match.group(1))
            rows = raw_data['table']['rows']
            
            tags = set()
            april_rows = 0
            geo_detected_rows = []
            
            for r in rows:
                cells = r['c']
                if not cells: continue
                def get_val(idx):
                    if idx < len(cells) and cells[idx] and 'v' in cells[idx]:
                        return cells[idx]['v']
                    return ""
                
                op_dept = str(get_val(COL_OP_DEPT)).strip()
                tags.add(op_dept)
                
                date_str = parse_gviz_date(str(get_val(COL_DATE)))
                if date_str.startswith("2026-04"):
                    april_rows += 1
                    if "Geo" in op_dept or "GEO" in op_dept:
                        geo_detected_rows.append((op_dept, str(get_val(COL_STATUS))))
            
            print(f"Unique tags in Op. Department: {sorted(list(tags))}")
            print(f"Total rows in April 2026: {april_rows}")
            print(f"Geo-related rows in April 2026: {len(geo_detected_rows)}")
            for tag, status in geo_detected_rows:
                print(f"  {tag}: {status}")
                
    except Exception as e:
        print(f"Error: {e}")

audit_unique_tags()
