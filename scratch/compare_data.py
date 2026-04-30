import json, urllib.request, re, time
from datetime import datetime

def fetch_sheet_data_gviz(sheet_id, sheet_name):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:json&sheet={sheet_name.replace(' ', '+')}&t={int(time.time())}"
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
                row_vals = []
                if cells:
                    for c in cells:
                        val = ""
                        if c is not None:
                            if 'v' in c and c['v'] is not None:
                                val = c['v']
                            elif 'f' in c and c['f'] is not None:
                                val = str(c['f'])
                        row_vals.append(val)
                processed_rows.append(row_vals)
            return processed_rows
    except Exception as e:
        print(f"Error fetching sheet {sheet_name}: {e}")
        return []

def safe_float(val):
    try:
        return float(str(val).replace("$", "").replace(",", "").strip())
    except:
        return 0.0

def compare():
    sheet_id = "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"
    sheet_name = "Kam Data"
    
    # Target Month: April 2026
    target_month_str = "2026-04"
    
    print(f"Fetching data from Google Sheet ({sheet_name}) for {target_month_str}...")
    rows = fetch_sheet_data_gviz(sheet_id, sheet_name)
    if not rows: return

    # Column indices
    COL = {
        "service": 20,
        "amount_x": 23,
        "status": 19,
        "date": 3,
        "del_date": 22
    }

    sheet_total = 0
    sheet_count = 0
    
    for i, r in enumerate(rows):
        if i == 0: continue
        while len(r) <= 23: r.append("")
        
        service = str(r[20]).strip().upper()
        if "SEO" in service or "SMM" in service:
            status = str(r[19]).strip()
            
            # Date Logic from agent_engine.py
            date_val = str(r[22]) if status == 'Delivered' else str(r[3])
            
            # Check if date starts with Target Month (e.g. 2026-04)
            # Sheet dates are often strings like "2026-04-15" or Date(2026,3,15)
            # Gviz 'v' for Date(2026,3,15) is "Date(2026,3,15)"
            
            clean_date = ""
            if date_val.startswith('Date('):
                parts = date_val[5:-1].split(',')
                y, m, d = int(parts[0]), int(parts[1]) + 1, int(parts[2])
                clean_date = f"{y:04d}-{m:02d}"
            else:
                clean_date = date_val[:7]
                
            if clean_date == target_month_str:
                amt = safe_float(r[23])
                if status == "Delivered":
                    sheet_total += amt
                sheet_count += 1

    print(f"Sheet Summary (April 2026): Total Projects={sheet_count}, Delivered Amount={sheet_total}")

    print("\nFetching data from VPS API...")
    try:
        with urllib.request.urlopen("http://134.209.219.70/api/data") as res:
            vps_data = json.loads(res.read().decode('utf-8'))
            vps_summary = vps_data.get("summary", {})
            vps_total = vps_summary.get("totalAchieved", 0)
            vps_count = vps_summary.get("seoSmmRows", 0) # seoSmmRows is the total count in engine
            print(f"VPS Summary: Total Projects={vps_count}, Delivered Amount={vps_total}")
            
            if abs(sheet_total - vps_total) < 1:
                print("\nDATA IS IN SYNC!")
            else:
                print(f"\nDATA DISCREPANCY! Difference: {abs(sheet_total - vps_total)}")
    except Exception as e:
        print(f"Error fetching VPS data: {e}")

if __name__ == "__main__":
    compare()
