import openpyxl
import json
import sys
import re
sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook(
    r'c:\Users\Jahidul Islam\Downloads\jahidul\Employee Performance Evalution Sheet.xlsx',
    data_only=True
)
ws = wb['Kam Data']

geo_members = [
    # GEO Rankers
    {'name': 'Jahidul', 'fullName': 'Md. Jahidul Islam',   'id': '17137', 'team': 'GEO Rankers'},
    {'name': 'Sabit',   'fullName': 'MD SAIMUN SABED',     'id': '17384', 'team': 'GEO Rankers'},
    {'name': 'Komal',   'fullName': 'Komal Chandro Roy',   'id': '17066', 'team': 'GEO Rankers'},
    {'name': 'Hasibul', 'fullName': 'Md. Hasibul Hasan',   'id': '17135', 'team': 'GEO Rankers'},
    {'name': 'Shourav', 'fullName': 'Shafiul Alam Shourav','id': '17524', 'team': 'GEO Rankers'},
    {'name': 'Roni',    'fullName': 'Rony',                'id': '17490', 'team': 'GEO Rankers'},
    # Rank Riser
    {'name': 'Sushant', 'fullName': 'Shosunth Chakarborty','id': '17294', 'team': 'Rank Riser'},
    {'name': 'Sammi',   'fullName': 'Samiel Hembrom',      'id': '17234', 'team': 'Rank Riser'},
    {'name': 'Samia',   'fullName': 'Samia ahmed',         'id': '17491', 'team': 'Rank Riser'},
    {'name': 'Pinky',   'fullName': 'Afsana Parvin Pinky', 'id': '17385', 'team': 'Rank Riser'},
    {'name': 'Reza',    'fullName': 'Ahmed Al Reza',       'id': '17074', 'team': 'Rank Riser'},
    {'name': 'Aritri',  'fullName': 'Aritri Biswas Sneha', 'id': '17541', 'team': 'Rank Riser'},
    {'name': 'Robel',   'fullName': 'Muhammad Ali Robel',  'id': '17046', 'team': 'Rank Riser'},
    {'name': 'Sobuz',   'fullName': 'MD.Sobuj Hossain',    'id': '17152', 'team': 'Rank Riser'},
    {'name': 'Istiak Ahmed', 'fullName': 'Istiak Ahmed Soikot', 'id': '17383', 'team': 'Rank Riser'},
    {'name': 'Wakil',   'fullName': 'Waqil Hafiz',         'id': '17488', 'team': 'Rank Riser'},
    {'name': 'Rasel',   'fullName': 'Rasel Mia',           'id': '17049', 'team': 'Rank Riser'},
    {'name': 'Gazi Fahim', 'fullName': 'Gazi Fahim Hasan', 'id': '17149', 'team': 'Rank Riser'},
    # Search Apex
    {'name': 'Rezwan',  'fullName': 'Rezwan Ahmed',        'id': '17492', 'team': 'Search Apex'},
    {'name': 'Jobaeid', 'fullName': 'Jobaeid Kha',         'id': '17493', 'team': 'Search Apex'},
    {'name': 'Harun',   'fullName': 'Harun',               'id': '17299', 'team': 'Search Apex'},
    {'name': 'Babu',    'fullName': 'Nishar Farazi Babu',  'id': '17317', 'team': 'Search Apex'},
    {'name': 'Akash',   'fullName': 'ashiqur Rahaman',     'id': '17369', 'team': 'Search Apex'},
    {'name': 'Sifat',   'fullName': 'M A Muyeed Sifat',    'id': '17246', 'team': 'Search Apex'},
    {'name': 'Imran',   'fullName': 'Sheikh Al Imran',     'id': '17301', 'team': 'Search Apex'},
    {'name': 'Tihim',   'fullName': 'Shihadul Islam Tihim','id': '17248', 'team': 'Search Apex'},
    # Dark Rankers
    {'name': 'Alamin',  'fullName': 'Al Amin',             'id': '17236', 'team': 'Dark Rankers'},
    {'name': 'Ibrahim', 'fullName': 'Ibrahim',             'id': '17136', 'team': 'Dark Rankers'},
    {'name': 'Raj',     'fullName': 'Atikuzzaman Raj',     'id': '17235', 'team': 'Dark Rankers'},
    {'name': 'Turjo',   'fullName': 'Tohidul Islam Turjo', 'id': '17058', 'team': 'Dark Rankers'},
    {'name': 'Saiful',  'fullName': 'Saiful Islam Sagor',  'id': '17318', 'team': 'Dark Rankers'},
    {'name': 'Romjan',  'fullName': 'Md Romjanul Islam',   'id': '17233', 'team': 'Dark Rankers'},
    {'name': 'Istiak',  'fullName': 'Istiak',              'id': '17238', 'team': 'Dark Rankers'},
]

stats = {}
projects = {}
for m in geo_members:
    key = m['name']
    stats[key] = {
        'WIP': 0, 'Revision': 0, 'Delivered': 0,
        'Cancelled': 0, 'Total': 0,
        'DeliveredAmt': 0.0, 'WIPAmt': 0.0,
    }
    projects[key] = []

member_lookup = {m['name'].strip().lower(): m['name'] for m in geo_members}

def normalize_assignee_token(token):
    token = re.sub(r'\([^)]*\)', '', token or '')
    token = re.sub(r'\b\d+%?\b', '', token)
    token = re.sub(r'\s+', ' ', token).strip(' -')
    return token.strip()

def parse_assignees(assign_text):
    parts = [p.strip() for p in re.split(r'[/,]', assign_text or '')]
    exact = []
    seen = set()
    for part in parts:
        key = normalize_assignee_token(part).lower()
        if key in member_lookup and key not in seen:
            exact.append(member_lookup[key])
            seen.add(key)
    return exact

for row in ws.iter_rows(min_row=2, values_only=True):
    assign = str(row[18]).strip() if row[18] else ''
    status = str(row[19]).strip() if row[19] else ''
    service = str(row[20]).strip() if row[20] else ''
    service_upper = service.upper()
    if 'SEO' not in service_upper and 'SMM' not in service_upper:
        continue

    amt_x = row[23]
    order_num = row[13]
    order_link = row[14]
    client = row[10]
    date = str(row[3])[:10] if row[3] else ''
    delivered_date = str(row[22])[:10] if row[22] else ''
    delivered_by = str(row[21]) if row[21] else ''

    matched_members = parse_assignees(assign)
    if not matched_members:
        continue

    try:
        amt_val = float(str(amt_x).replace('$','').replace(',','').strip()) if amt_x else 0.0
        share = round(amt_val / len(matched_members), 2)
    except:
        amt_val = 0.0
        share = 0.0

    proj = {
        'order': str(order_num) if order_num else 'N/A',
        'link': str(order_link) if order_link else '#',
        'client': str(client) if client else 'N/A',
        'assign': assign,
        'service': service,
        'status': status,
        'amtX': amt_val,
        'share': share,
        'date': date,
        'deliveredDate': delivered_date,
        'deliveredBy': delivered_by,
    }

    for key in matched_members:
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

MEM_TARGET = 1100.0

output = []
for m in geo_members:
    key = m['name']
    s = stats[key]
    output.append({
        'name': key,
        'fullName': m['fullName'],
        'id': m['id'],
        'team': m['team'],
        'target': MEM_TARGET,
        'total': s['Total'],
        'wip': s['WIP'],
        'revision': s['Revision'],
        'delivered': s['Delivered'],
        'cancelled': s['Cancelled'],
        'deliveredAmt': round(s['DeliveredAmt'], 2),
        'wipAmt': round(s['WIPAmt'], 2),
        'remaining': round(s['DeliveredAmt'] - MEM_TARGET, 2),
        'progress': round((s['DeliveredAmt'] / MEM_TARGET) * 100, 1),
        'projects': projects[key],
    })

with open(r'c:\Users\Jahidul Islam\Downloads\jahidul\geo_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("✅ geo_data.json saved successfully!")
for m in output:
    print(f"  {m['name']}: Delivered={m['delivered']}, DeliveredAmt=${m['deliveredAmt']}, WIPAmt=${m['wipAmt']}, Progress={m['progress']}%")
