import os
import re
import json
import urllib.request
import time
from dotenv import load_dotenv

load_dotenv()

SHEET_ID = os.getenv("SHEET_ID")

def find_term_anywhere(term):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return
            raw_data = json.loads(match.group(1))
            rows = raw_data['table']['rows']
            
            matches = []
            for r_idx, r in enumerate(rows):
                cells = r['c']
                if not cells: continue
                for c_idx, c in enumerate(cells):
                    if c and 'v' in c and term.lower() in str(c['v']).lower():
                        matches.append((r_idx, c_idx, str(c['v'])))
            
            if matches:
                print(f"Found '{term}' in {len(matches)} places:")
                # Show first 10
                for r, c, val in matches[:10]:
                    print(f"  Row {r}, Col {c}: {val}")
                # Analyze common columns
                cols = [m[1] for m in matches]
                from collections import Counter
                print("\nFrequency by Column Index:")
                print(Counter(cols))
            else:
                print(f"'{term}' not found anywhere.")
                
    except Exception as e:
        print(f"Error: {e}")

find_term_anywhere("Geo")
find_term_anywhere("Rank")
