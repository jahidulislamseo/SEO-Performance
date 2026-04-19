import urllib.request, json, re
url = 'https://docs.google.com/spreadsheets/d/1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE/gviz/tq?tqx=out:json&sheet=Kam+Data'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        raw = json.loads(match.group(1))
        rows = raw['table']['rows']
        
        counts = {}
        for r in rows[1:]:
            c = r['c']
            val26 = str(c[26]['v']).strip().lower().replace('_', ' ') if len(c) > 26 and c[26] and 'v' in c[26] else ''
            val20 = str(c[20]['v']).strip().upper() if len(c) > 20 and c[20] and 'v' in c[20] else ''
            if ('SEO' in val20 or 'SMM' in val20):
                counts[val26] = counts.get(val26, 0) + 1
        print('Op_Dept counts for SEO/SMM:')
        for k, v in counts.items():
            print(f'"{k}": {v}')
except Exception as e:
    print(e)
