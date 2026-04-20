import json, os, urllib.request, re, time, urllib.parse
from dotenv import load_dotenv

load_dotenv()
SHEET_ID = os.getenv('SHEET_ID')

def get_sheet_tab(tab_name):
    encoded_tab = urllib.parse.quote(tab_name)
    url = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={encoded_tab}&t={int(time.time())}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        if not match: return []
        return json.loads(match.group(1))['table']['rows']

print("--- FETCHING FULL STATS FROM 'All Member Data' ---")
rows = get_sheet_tab('All Member Data')
for idx, r in enumerate(rows):
    c = r['c']
    if not c: continue
    # Col A: ID, B: Name, D: Desig, G: Team, L: Running, M: Delivered, N: Cancelled
    id   = c[0]['v'] if len(c)>0 and c[0] else 'N/A'
    name = c[1]['v'] if len(c)>1 and c[1] else 'N/A'
    team = c[6]['v'] if len(c)>6 and c[6] else 'N/A'
    run  = c[11]['v'] if len(c)>11 and c[11] else 0
    delv = c[12]['v'] if len(c)>12 and c[12] else 0
    can  = c[13]['v'] if len(c)>13 and c[13] else 0
    
    if name != 'N/A' and name != 'Employee Name':
        print(f"{name} ({team}) | ID: {id} | Running: {run} | Delv: {delv} | Can: {can}")
