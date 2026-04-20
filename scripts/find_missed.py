import json, os, urllib.request, re, time

SHEET_ID = "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"
MEMBERS = ['Jahidul','Sabit','Komal','Hasibul','Shourav','Roni','Sushant','Sammi','Samia','Pinky','Reza','Aritri','Robel','Sobuz','Istiak Ahmed','Wakil','Rasel','Gazi Fahim','Rezwan','Jobaeid','Harun','Babu','Akash','Sifat','Imran','Tihim','Alamin','Ibrahim','Raj','Turjo','Saiful','Romjan','Istiak']

def normalize_token(token):
    token = re.sub(r"\([^)]*\)", "", token or "")
    token = re.sub(r"\b\d+%?\b", "", token)
    return token.lower().strip()

def get_sheet_data():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        return json.loads(match.group(1))['table']['rows']

rows = get_sheet_data()
member_set = {m.lower().strip() for m in MEMBERS}

missed_sync = []
missed_match = []

for idx, r in enumerate(rows[1:]):
    c = r['c']
    service = str(c[20]['v'] if len(c)>20 and c[20] else '').upper()
    if 'SEO' in service or 'SMM' in service:
        # Check if it would be synced
        order = str(c[13]['v'] if len(c)>13 and c[13] else 'NA')
        assign = str(c[18]['v'] if len(c)>18 and c[18] else 'NA')
        
        # Check matching
        tokens = [normalize_token(p) for p in re.split(r"[/,]", assign)]
        found = any(t in member_set for t in tokens)
        
        if not found:
            missed_match.append({"row": idx+2, "order": order, "assign": assign})

print(json.dumps(missed_match, indent=2))
