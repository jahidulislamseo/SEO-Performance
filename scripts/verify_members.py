import urllib.request, json, re, time

def get_members(sheet_id):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:json&sheet=All+Member+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        raw = json.loads(match.group(1))
        rows = raw['table']['rows']
        members = []
        for r in rows:
            c = r['c']
            if len(c) > 6 and c[2] and c[2]['v'] and c[6] and c[6]['v']:
                members.append({
                    "name": str(c[2]['v']).strip(),
                    "team": str(c[6]['v']).strip()
                })
        return members

SHEET_ID = "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"
members = get_members(SHEET_ID)
print(f"Total members found: {len(members)}")
for m in members:
    if 'Raj' in m['name'] or 'Raj' in m['team']:
        print(f"Match: {m}")
