import json, os, urllib.request, re, time

SHEET_ID = "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"

def get_sheet_data():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        return json.loads(match.group(1))['table']['rows']

rows = get_sheet_data()
ids = {}

for idx, r in enumerate(rows[1:]):
    c = r['c']
    service = str(c[20]['v'] if len(c)>20 and c[20] else '').upper()
    if 'SEO' in service or 'SMM' in service:
        order = str(c[13]['v'] if len(c)>13 and c[13] else 'NA').strip()
        del_by = str(c[21]['v'] if len(c)>21 and c[21] else '').strip()
        doc_id = f"{order}_{del_by}".replace(" ", "_")
        
        if doc_id in ids:
            print(f"DUPLICATE ID DETECTED: {doc_id}")
            print(f"  Row {ids[doc_id]['row']}: {ids[doc_id]['assign']} - {ids[doc_id]['amount']}")
            print(f"  Row {idx+2}: {str(c[18]['v'])} - {str(c[23]['v'])}")
        else:
            ids[doc_id] = {"row": idx+2, "assign": str(c[18]['v']), "amount": str(c[23]['v'])}

print(f"Total Unique IDs: {len(ids)}")
