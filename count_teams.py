import urllib.request, json, time, re

def get_live():
    url = f"https://docs.google.com/spreadsheets/d/1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        raw = json.loads(match.group(1))
        return raw['table']['rows']

rows = get_live()

teams = ['Rank Riser', 'GEO Rankers', 'Search Apex', 'Dark Rankers']
counts = {t: 0 for t in teams}

def normalize_team(t):
    return str(t).lower().replace(' ', '').replace('_', '')

for r in rows[1:]:
    c = r['c']
    assign = str(c[18]['v']).strip() if len(c) > 18 and c[18] and 'v' in c[18] else ''
    del_by = str(c[21]['v']).strip() if len(c) > 21 and c[21] and 'v' in c[21] else ''
    service = str(c[20]['v']).strip().upper() if len(c) > 20 and c[20] and 'v' in c[20] else ''
    
    if ('SEO' in service or 'SMM' in service):
        if del_by:
            for t in teams:
                if normalize_team(del_by) == normalize_team(t):
                    counts[t] += 1

print("Team Order Matches:")
for k, v in counts.items():
    print(f"{k}: {v}")
