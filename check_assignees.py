import urllib.request, json, re
url = 'https://docs.google.com/spreadsheets/d/1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE/gviz/tq?tqx=out:json&sheet=Kam+Data'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        raw = json.loads(match.group(1))
        rows = raw['table']['rows']
        
        miss_assign_but_has_team = 0
        total_team_orders = 0
        for r in rows[1:]:
            c = r['c']
            assign = str(c[18]['v']).strip() if len(c) > 18 and c[18] and 'v' in c[18] else ''
            val21 = str(c[21]['v']).strip() if len(c) > 21 and c[21] and 'v' in c[21] else ''
            val20 = str(c[20]['v']).strip().upper() if len(c) > 20 and c[20] and 'v' in c[20] else ''
            
            if ('SEO' in val20 or 'SMM' in val20):
                if val21:
                    total_team_orders += 1
                    if not assign:
                        miss_assign_but_has_team += 1
                        
        print(f"Total Team Tagged SEO/SMM Orders: {total_team_orders}")
        print(f"Missing Assignees but have Team Tag: {miss_assign_but_has_team}")
except Exception as e:
    print(e)
