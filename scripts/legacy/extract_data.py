import json, re, sys, os, time, urllib.request
sys.stdout.reconfigure(encoding='utf-8')
from shared_utils import (
    SHEET_ID, MONGO_URI, DB_NAME, MEM_TARGET,
    get_db, parse_gviz_date, normalize_assignee_token, fetch_sheet_data_gviz
)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_OUTPUT = os.path.join(BASE_DIR, 'data', 'geo_data.json')

def get_current_members():
    db = get_db()
    members = list(db["members"].find({}, {"_id": 0}))
    return members

geo_members = get_current_members()
member_lookup = {m['name'].strip().lower(): m['name'] for m in geo_members}

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

def parse_assignees_local(assign_text):
    parts = [p.strip() for p in re.split(r'[/,]', assign_text or '')]
    found, seen = [], set()
    for p in parts:
        key = normalize_assignee_token(p).lower()
        if key in member_lookup and key not in seen:
            found.append(member_lookup[key])
            seen.add(key)
    return found

print("Fetching live data from Google Sheets...")
rows_raw = fetch_sheet_data_gviz('Kam Data')
# Convert back to the format this script expects (list of cells)
rows = []
for r in rows_raw:
    row_cells = {'c': [{'v': val} for val in r]}
    rows.append(row_cells)

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

    all_parts = [p.strip() for p in re.split(r'[/,]', assign or "")]
    unique_assignees = set()
    for p in all_parts:
        token = normalize_assignee_token(p).lower()
        if token: unique_assignees.add(token)
    
    # Share is divided equally among ALL people mentioned in the cell
    num_assigned = len(unique_assignees) if unique_assignees else 1

    try:
        amt_val = float(cell(23).replace('$','').replace(',','').strip())
    except:
        amt_val = 0.0
    
    share = round(amt_val / num_assigned, 2)

    matched = parse_assignees_local(assign)
    if not matched:
        continue

    proj = {
        'order':         cell(13) or 'N/A',
        'link':          cell(14) or '#',
        'instruction':   cell(15) or '',
        'profile':       cell(6) or 'N/A',
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
        'target':       MEM_TARGET(),
        'total':        s['Total'],
        'wip':          s['WIP'],
        'revision':     s['Revision'],
        'delivered':    s['Delivered'],
        'cancelled':    s['Cancelled'],
        'deliveredAmt': round(s['DeliveredAmt'], 2),
        'wipAmt':       round(s['WIPAmt'], 2),
        'remaining':    round(s['DeliveredAmt'] - MEM_TARGET(), 2),
        'progress':     round((s['DeliveredAmt'] / MEM_TARGET()) * 100, 1),
        'projects':     projects[key],
    })

with open(DATA_OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✅ geo_data.json saved successfully! ({len(output)} members)")
for m in output:
    print(f"  {m['name']}: Delivered={m['delivered']}, DeliveredAmt=${m['deliveredAmt']}, Progress={m['progress']}%")
