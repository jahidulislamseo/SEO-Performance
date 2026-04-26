import json
import urllib.request
import re
import time
import os
from dotenv import load_dotenv

load_dotenv()

SHEET_ID = "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"

def fetch_data():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Query+Sheet&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        raw_data = json.loads(match.group(1))
        rows = raw_data['table']['rows']
        
        # Look for rows with data in col 12 or 13
        for i, r in enumerate(rows):
            cells = r['c']
            if cells and len(cells) > 13:
                conv = cells[12]['v'] if cells[12] and 'v' in cells[12] else None
                brief = cells[13]['v'] if cells[13] and 'v' in cells[13] else None
                if conv or brief:
                    print(f"Row {i}: conv={conv}, brief={brief}")
                    break

fetch_data()
