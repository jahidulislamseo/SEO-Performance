import json, re, sys, os, time, urllib.request
sys.stdout.reconfigure(encoding='utf-8')

SHEET_ID   = "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_OUTPUT = os.path.join(BASE_DIR, 'geo_data.json')
MEM_TARGET  = 1100.0

geo_members = [
    {'name': 'Jahidul',     'fullName': 'Md. Jahidul Islam',       'id': '17137', 'team': 'GEO Rankers'},
    {'name': 'Sabit',       'fullName': 'MD SAIMUN SABED',         'id': '17384', 'team': 'GEO Rankers'},
    {'name': 'Komal',       'fullName': 'Komal Chandro Roy',       'id': '17066', 'team': 'GEO Rankers'},
    {'name': 'Hasibul',     'fullName': 'Md. Hasibul Hasan',       'id': '17135', 'team': 'GEO Rankers'},
    {'name': 'Shourav',     'fullName': 'Shafiul Alam Shourav',    'id': '17524', 'team': 'GEO Rankers'},
    {'name': 'Roni',        'fullName': 'Rony',                    'id': '17490', 'team': 'GEO Rankers'},
    {'name': 'Sushant',     'fullName': 'Shosunth Chakarborty',    'id': '17294', 'team': 'Rank Riser'},
    {'name': 'Sammi',       'fullName': 'Samiel Hembrom',          'id': '17234', 'team': 'Rank Riser'},
    {'name': 'Samia',       'fullName': 'Samia ahmed',             'id': '17491', 'team': 'Rank Riser'},
    {'name': 'Pinky',       'fullName': 'Afsana Parvin Pinky',     'id': '17385', 'team': 'Rank Riser'},
    {'name': 'Reza',        'fullName': 'Ahmed Al Reza',           'id': '17074', 'team': 'Rank Riser'},
    {'name': 'Aritri',      'fullName': 'Aritri Biswas Sneha',     'id': '17541', 'team': 'Rank Riser'},
    {'name': 'Robel',       'fullName': 'Muhammad Ali Robel',      'id': '17046', 'team': 'Rank Riser'},
    {'name': 'Sobuz',       'fullName': 'MD.Sobuj Hossain',        'id': '17152', 'team': 'Rank Riser'},
    {'name': 'Istiak Ahmed','fullName': 'Istiak Ahmed Soikot',     'id': '17383', 'team': 'Rank Riser'},
    {'name': 'Wakil',       'fullName': 'Waqil Hafiz',             'id': '17488', 'team': 'Rank Riser'},
    {'name': 'Rasel',       'fullName': 'Rasel Mia',               'id': '17049', 'team': 'Rank Riser'},
    {'name': 'Gazi Fahim',  'fullName': 'Gazi Fahim Hasan',        'id': '17149', 'team': 'Rank Riser'},
    {'name': 'Rezwan',      'fullName': 'Rezwan Ahmed',            'id': '17492', 'team': 'Search Apex'},
    {'name': 'Jobaeid',     'fullName': 'Jobaeid Kha',             'id': '17493', 'team': 'Search Apex'},
    {'name': 'Harun',       'fullName': 'Harun',                   'id': '17299', 'team': 'Search Apex'},
    {'name': 'Babu',        'fullName': 'Nishar Farazi Babu',      'id': '17317', 'team': 'Search Apex'},
    {'name': 'Akash',       'fullName': 'ashiqur Rahaman',         'id': '17369', 'team': 'Search Apex'},
    {'name': 'Sifat',       'fullName': 'M A Muyeed Sifat',        'id': '17246', 'team': 'Search Apex'},
    {'name': 'Imran',       'fullName': 'Sheikh Al Imran',         'id': '17301', 'team': 'Search Apex'},
    {'name': 'Tihim',       'fullName': 'Shihadul Islam Tihim',    'id': '17248', 'team': 'Search Apex'},
    {'name': 'Alamin',      'fullName': 'Al Amin',                 'id': '17236', 'team': 'Dark Rankers'},
    {'name': 'Ibrahim',     'fullName': 'Ibrahim',                 'id': '17136', 'team': 'Dark Rankers'},
    {'name': 'Raj',         'fullName': 'Atikuzzaman Raj',         'id': '17235', 'team': 'Dark Rankers'},
    {'name': 'Turjo',       'fullName': 'Tohidul Islam Turjo',     'id': '17058', 'team': 'Dark Rankers'},
    {'name': 'Saiful',      'fullName': 'Saiful Islam Sagor',      'id': '17318', 'team': 'Dark Rankers'},
    {'name': 'Romjan',      'fullName': 'Md Romjanul Islam',       'id': '17233', 'team': 'Dark Rankers'},
    {'name': 'Istiak',      'fullName': 'Istiak',                  'id': '17238', 'team': 'Dark Rankers'},
]

member_lookup = {m['name'].strip().lower(): m['name'] for m in geo_members}

def fetch_sheet_rows(sheet_name):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={sheet_name}&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        raw = json.loads(match.group(1))
        return raw['table']['rows']

def parse_gviz_val(cell):
    if not cell or 'v' not in cell or cell['v'] is None:
        return ''
    v = cell['v']
    s = str(v)
    if s.startswith('Date(') and s.endswith(')'):
        try:
            parts = s[5:-1].split(',')
            return f"{parts[0]}-{int(parts[1])+1:02d}-{parts[2].zfill(2)}"
        except:
            pass
    return s

def normalize_token(token):
    token = re.sub(r'\([^)]*\)', '', token or '')
    token = re.sub(r'\b\d+%?\b', '', token)
    token = re.sub(r'\s+', ' ', token).strip(' -')
    return token.strip()

def parse_assignees(assign_text):
    parts = [p.strip() for p in re.split(r'[/,]', assign_text or '')]
    found, seen = [], set()
    for p in parts:
        key = normalize_token(p).lower()
        if key in member_lookup and key not in seen:
            found.append(member_lookup[key])
            seen.add(key)
    return found

print("Fetching live data from Google Sheets...")
rows = fetch_sheet_rows('Kam+Data')
print(f"  {len(rows)-1} data rows fetched.")

stats    = {m['name']: {'WIP':0,'Revision':0,'Delivered':0,'Cancelled':0,'Total':0,'DeliveredAmt':0.0,'WIPAmt':0.0} for m in geo_members}
projects = {m['name']: [] for m in geo_members}

for r in rows[1:]:
    c = r['c']
    def cell(i): return parse_gviz_val(c[i]) if len(c) > i else ''

    assign  = cell(18).strip()
    status  = cell(19).strip()
    service = cell(20).upper()
    if 'SEO' not in service and 'SMM' not in service:
        continue

    matched = parse_assignees(assign)
    if not matched:
        continue

    try:
        amt_val = float(cell(23).replace('$','').replace(',','').strip())
    except:
        amt_val = 0.0
    share = round(amt_val / len(matched), 2)

    proj = {
        'order':         cell(13) or 'N/A',
        'link':          cell(14) or '#',
        'client':        cell(10) or 'N/A',
        'assign':        assign,
        'service':       cell(20),
        'status':        status,
        'amtX':          amt_val,
        'share':         share,
        'date':          cell(3)[:10],
        'deliveredDate': cell(22)[:10],
        'deliveredBy':   cell(21),
    }

    for key in matched:
        stats[key]['Total'] += 1
        projects[key].append(proj)
        if status == 'WIP':
            stats[key]['WIP'] += 1
            stats[key]['WIPAmt'] += share
        elif status == 'Revision':
            stats[key]['Revision'] += 1
            stats[key]['WIPAmt'] += share
        elif status == 'Delivered':
            stats[key]['Delivered'] += 1
            stats[key]['DeliveredAmt'] += share
        elif status == 'Cancelled':
            stats[key]['Cancelled'] += 1

output = []
for m in geo_members:
    key = m['name']
    s   = stats[key]
    output.append({
        'name':         key,
        'fullName':     m['fullName'],
        'id':           m['id'],
        'team':         m['team'],
        'target':       MEM_TARGET,
        'total':        s['Total'],
        'wip':          s['WIP'],
        'revision':     s['Revision'],
        'delivered':    s['Delivered'],
        'cancelled':    s['Cancelled'],
        'deliveredAmt': round(s['DeliveredAmt'], 2),
        'wipAmt':       round(s['WIPAmt'], 2),
        'remaining':    round(s['DeliveredAmt'] - MEM_TARGET, 2),
        'progress':     round((s['DeliveredAmt'] / MEM_TARGET) * 100, 1),
        'projects':     projects[key],
    })

with open(DATA_OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✅ geo_data.json saved successfully! ({len(output)} members)")
for m in output:
    print(f"  {m['name']}: Delivered={m['delivered']}, DeliveredAmt=${m['deliveredAmt']}, Progress={m['progress']}%")
