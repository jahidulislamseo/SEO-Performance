import time, re, urllib.request, json

def fetch_by_gid(sheet_id, gid):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:json&gid={gid}&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return []
            raw_data = json.loads(match.group(1))
            rows_raw = raw_data['table']['rows']
            processed_rows = []
            for r in rows_raw:
                cells = r['c']
                row_vals = [ (c['v'] if c and 'v' in c else "") for c in cells ] if cells else []
                processed_rows.append(row_vals)
            return processed_rows
    except Exception as e:
        print(f"Error: {e}")
        return []

SHEET_ID = "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"
GID = "1872618218"

rows = fetch_by_gid(SHEET_ID, GID)
print(f"Found {len(rows)} rows with GID {GID}")
if rows:
    print("Header:", rows[0])
    print("Row 1:", rows[1])
