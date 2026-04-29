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
COL_ORDER = 13
COL_DEL_DATE = 22

def parse_gviz_date(val_str):
    if val_str.startswith('Date(') and val_str.endswith(')'):
        try:
            parts = val_str[5:-1].split(',')
            y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
            return f"{y:04d}-{m+1:02d}-{d:02d}"
        except: pass
    return val_str

def list_geo_delivered_improved():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return
            raw_data = json.loads(match.group(1))
            rows = raw_data['table']['rows']
            
            delivered_list = []
            for r in rows:
                cells = r['c']
                if not cells: continue
                def get_val(idx):
                    if idx < len(cells) and cells[idx] and 'v' in cells[idx]:
                        return cells[idx]['v']
                    return ""
                
                tag = str(get_val(COL_TAG)).strip()
                status = str(get_val(COL_STATUS)).strip()
                
                if tag != "Geo_Rankers": continue
                
                order_date = parse_gviz_date(str(get_val(COL_DATE)))
                del_date = parse_gviz_date(str(get_val(COL_DEL_DATE)))
                
                calc_date = del_date if status == "Delivered" else order_date
                
                if calc_date.startswith("2026-04"):
                    delivered_list.append((get_val(COL_ORDER), status, calc_date))
            
            print(f"GEO Rankers Projects in April 2026 ({len(delivered_list)} total):")
            for order, status, date in delivered_list:
                print(f"  {order} | {status} | {date}")
                
    except Exception as e:
        print(f"Error: {e}")

list_geo_delivered_improved()
