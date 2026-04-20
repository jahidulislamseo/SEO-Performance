import urllib.request, json, re, time

def get_data():
    url = f"https://docs.google.com/spreadsheets/d/1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        return json.loads(match.group(1))['table']

table = get_data()
rows = table['rows']
cols = table['cols']

# Find rows containing "Romjan" (case insensitive) in the Assign column (Index 18)
# and are in April 2026 (Column 3 or Column 22?)
# Current code uses Column 3 for Project Date.

romjan_rows = []
for i, r in enumerate(rows[1:]):
    c = r['c']
    assign = str(c[18]['v']).lower() if len(c) > 18 and c[18] and 'v' in c[18] else ''
    if 'romjan' in assign:
        date = ""
        # Handle Gviz date objects
        if len(c) > 3 and c[3] and 'v' in c[3]:
            v = c[3]['v']
            if isinstance(v, str) and v.startswith('Date('):
                parts = v[5:-1].split(',')
                date = f"{parts[0]}-{int(parts[1])+1:02d}-{parts[2].zfill(2)}"
            else:
                date = str(v)
        
        status = str(c[19]['v']) if len(c) > 19 and c[19] and 'v' in c[19] else ''
        service = str(c[20]['v']) if len(c) > 20 and c[20] and 'v' in c[20] else ''
        team_tag = str(c[21]['v']) if len(c) > 21 and c[21] and 'v' in c[21] else ''
        amt = str(c[23]['v']) if len(c) > 23 and c[23] and 'v' in c[23] else '0'
        
        romjan_rows.append({
            'row_num': i + 2,
            'date': date,
            'assign': str(c[18]['v']) if len(c) > 18 and c[18] else '',
            'status': status,
            'service': service,
            'team_tag': team_tag,
            'amount': amt
        })

# Print all Romjan rows for April 2026
print("Romjan Rows in April 2026:")
for r in romjan_rows:
    if r['date'].startswith('2026-04'):
        print(r)

print("\nAll Romjan Rows (any date):")
for r in romjan_rows[:20]:
    print(r)
