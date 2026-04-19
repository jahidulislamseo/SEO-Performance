import urllib.request, json, re, time

SHEET_ID = "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"

def get_json(sheet_name):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={sheet_name}&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        return json.loads(match.group(1))['table']

# 1. Fetch Members
member_table = get_json("All+Member+Data")
members = []
for r in member_table['rows']:
    c = r['c']
    if len(c) > 6 and c[2] and c[2]['v'] and c[6] and c[6]['v']:
        members.append({
            "name": str(c[2]['v']).strip(),
            "team": str(c[6]['v']).strip()
        })

# 2. Fetch Kam Data
kam_table = get_json("Kam+Data")
rows = kam_table['rows']

print(f"Checking GEO Rankers members in April 2026...")
geo_members = [m for m in members if m['team'] == 'GEO Rankers']
print(f"GEO Members: {[m['name'] for m in geo_members]}")

# 3. Analyze rows
for i, r in enumerate(rows[1:]):
    c = r['c']
    assign = str(c[18]['v']).strip() if len(c) > 18 and c[18] and 'v' in c[18] else ''
    status = str(c[19]['v']).strip() if len(c) > 19 and c[19] and 'v' in c[19] else ''
    service = str(c[20]['v']).strip().upper() if len(c) > 20 and c[20] and 'v' in c[20] else ''
    del_by = str(c[21]['v']).strip() if len(c) > 21 and c[21] and 'v' in c[21] else ''
    
    # Check for GEO Rankers rows
    if 'GEO' in del_by.upper():
        date = ""
        if len(c) > 3 and c[3] and 'v' in c[3]:
            # Simple check for April
            v = str(c[3]['v'])
            if '2026' in v and '3' in v: # Gviz month 3 is April
                date = "April"
        
        if date == "April":
            print(f"Row {i+2}: TeamTag={del_by}, Status={status}, Service={service}, Assign={assign}")
            # Is any GEO member matched?
            parts = [p.strip().lower() for p in re.split(r'[/,]', assign)]
            found = []
            for m in geo_members:
                if m['name'].lower() in parts:
                    found.append(m['name'])
            if not found:
                print(f"  --> NO GEO MEMBER MATCHED in Assign Person column!")
            else:
                print(f"  --> Matched GEO Members: {found}")
