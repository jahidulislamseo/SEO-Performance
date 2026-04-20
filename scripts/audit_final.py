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
COL_TAG = 21

def parse_gviz_date(val_str):
    if val_str.startswith('Date(') and val_str.endswith(')'):
        try:
            parts = val_str[5:-1].split(',')
            y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
            return f"{y:04d}-{m+1:02d}-{d:02d}"
        except: pass
    return val_str

def final_audit():
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
                
                tag = str(get_val(COL_TAG)).strip()
                date_str = parse_gviz_date(str(get_val(COL_DATE)))
                status = str(get_val(COL_STATUS)).strip()
                
                if tag == "Geo_Rankers" and date_str.startswith("2026-04"):
                    geo_rows.append(status)
            
            print(f"Final Count for Geo_Rankers in April 2026:")
            print(f"Total rows: {len(geo_rows)}")
            from collections import Counter
            counts = Counter(geo_rows)
            for s, c in counts.items():
                print(f"  {s}: {c}")
                
    except Exception as e:
        print(f"Error: {e}")

final_audit()
