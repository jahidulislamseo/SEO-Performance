import os
import re
import json
import urllib.request
import time
from dotenv import load_dotenv

load_dotenv()

SHEET_ID = os.getenv("SHEET_ID")

def fetch_sheet_headers(sheet_name):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={sheet_name.replace(' ', '+')}&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return None
            raw_data = json.loads(match.group(1))
            cols = raw_data['table']['cols']
            # google visualization might only return columns with headers
            # or it might have labels
            headers = [c.get('label', '') for c in cols]
            
            # If labels are empty, try to get the first row of data
            rows = raw_data['table']['rows']
            if rows:
                first_row = []
                for c in rows[0]['c']:
                    val = ""
                    if c and 'v' in c: val = str(c['v'])
                    first_row.append(val)
                return headers, first_row
            return headers, []
    except Exception as e:
        print(f"Error: {e}")
        return None, None

headers, first_row = fetch_sheet_headers("Kam Data")
if headers:
    print("Headers (labels):")
    for i, h in enumerate(headers):
        print(f"{i}: {h}")
    print("\nFirst Row Data:")
    for i, v in enumerate(first_row):
        print(f"{i}: {v}")
else:
    print("Failed to fetch headers.")
