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
COL_SERVICE = 20

def parse_gviz_date(val_str):
    if val_str.startswith('Date(') and val_str.endswith(')'):
        try:
            parts = val_str[5:-1].split(',')
            y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
            return f"{y:04d}-{m+1:02d}-{d:02d}"
        except: pass
    return val_str

def list_geo_services():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return
            raw_data = json.loads(match.group(1))
            rows = raw_data['table']['rows']
            
            project_list = []
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
                
                if not calc_date.startswith("2026-04"): continue
                
                service = str(get_val(COL_SERVICE)).strip()
                project_list.append((get_val(COL_ORDER), status, service))
            
            print(f"GEO Rankers Projects in April 2026:")
            from collections import Counter
            services = [p[2] for p in project_list]
            print(Counter(services))
            
            # Filtered by SEO/SMM
            filtered = [p for p in project_list if any(x in p[2].upper() for x in ["SEO", "SMM"])]
            print(f"\nFiltered (SEO/SMM) Total: {len(filtered)}")
            
            f_statuses = [p[1] for p in filtered]
            print(Counter(f_statuses))
                
    except Exception as e:
        print(f"Error: {e}")

list_geo_services()
