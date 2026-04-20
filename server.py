import json, os, urllib.request, re
from flask import Flask, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ─── CONFIG ───────────────────────────────────────────
SHEET_ID    = "1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"
CREDS_FILE  = os.path.join(os.path.dirname(__file__), "credentials.json")

DEPT_TARGET  = 36000
MEM_TARGET   = 1100   # per-member individual target
TEAM_TARGETS = {      # team-level display targets
    "GEO Rankers":  6000,
    "Rank Riser":  12000,
    "Search Apex":  9000,
    "Dark Rankers": 9000,
}
MANAGEMENT  = {
    "manager": {"name": "Mehedi Hassan", "title": "Project Manager"},
    "leaders": {
        "GEO Rankers":  {"name": "Md. Jahidul Islam",    "title": "Team Leader"},
        "Rank Riser":   {"name": "Gazi Fahim Hasan",     "title": "Team Leader"},
        "Search Apex":  {"name": "Shihadul Islam Tihim", "title": "Team Leader"},
        "Dark Rankers": {"name": "Istiak",               "title": "Team Leader"},
    }
}

# Column indices (0-indexed)
COL = {
    "assign":       18,   # S
    "status":       19,   # T
    "service":      20,   # U
    "del_by":       21,   # V
    "del_date":     22,   # W
    "amount_x":     23,   # X
    "order_num":    13,   # N
    "order_link":   14,   # O
    "client":       10,   # K
    "date":         3,    # D
    "op_dept":      21,   # V — Delivered By (team tag)
}

# Sheet team tag → dashboard team name mapping
TEAM_TAG_MAP = {
    "GEO Rankers":  "Geo_Rankers",
    "Rank Riser":   "Rank_Riser",
    "Search Apex":  "Search_Apex",
    "Dark Rankers": "Dark_Rankers",
}

# Updated ALL_MEMBERS list from 'All Member Data' sheet
ALL_MEMBERS = [
    # GEO Rankers
    {"name":"Jahidul","fullName":"Md. Jahidul Islam",         "id":"17137","team":"GEO Rankers","target":1100},
    {"name":"Sabit",  "fullName":"MD SAIMUN SABED",           "id":"17384","team":"GEO Rankers","target":1100},
    {"name":"Komal",  "fullName":"Komal Chandro Roy",         "id":"17066","team":"GEO Rankers","target":1100},
    {"name":"Hasibul","fullName":"Md. Hasibul Hasan",         "id":"17135","team":"GEO Rankers","target":1100},
    {"name":"Shourav","fullName":"Shafiul Alam Shourav",      "id":"17524","team":"GEO Rankers","target":1100},
    {"name":"Roni",   "fullName":"Rony",                      "id":"17490","team":"GEO Rankers","target":1100},
    # Rank Riser
    {"name":"Sushant","fullName":"Shosunth Chakarborty",      "id":"17294","team":"Rank Riser", "target":1100},
    {"name":"Sammi",  "fullName":"Samiel Hembrom",            "id":"17234","team":"Rank Riser", "target":1100},
    {"name":"Samia",  "fullName":"Samia ahmed",               "id":"17491","team":"Rank Riser", "target":1100},
    {"name":"Pinky",  "fullName":"Afsana Parvin Pinky",       "id":"17385","team":"Rank Riser", "target":1100},
    {"name":"Reza",   "fullName":"Ahmed Al Reza",              "id":"17074","team":"Rank Riser", "target":1100},
    {"name":"Aritri", "fullName":"Aritri Biswas Sneha",       "id":"17541","team":"Rank Riser", "target":1100},
    {"name":"Robel",  "fullName":"Muhammad Ali Robel",        "id":"17046","team":"Rank Riser", "target":1100},
    {"name":"Sobuz",  "fullName":"MD.Sobuj Hossain",           "id":"17152","team":"Rank Riser", "target":1100},
    {"name":"Istiak Ahmed", "fullName":"Istiak Ahmed Soikot", "id":"17383","team":"Rank Riser", "target":1100},
    {"name":"Wakil",  "fullName":"Waqil Hafiz",                "id":"17488","team":"Rank Riser", "target":1100},
    {"name":"Rasel",  "fullName":"Rasel Mia",                  "id":"17049","team":"Rank Riser", "target":1100},
    {"name":"Gazi Fahim", "fullName":"Gazi Fahim Hasan",      "id":"17149","team":"Rank Riser", "target":1100},
    # Search Apex
    {"name":"Rezwan", "fullName":"Rezwan Ahmed",               "id":"17492","team":"Search Apex","target":1100},
    {"name":"Jobaeid","fullName":"Jobaeid Kha",                "id":"17493","team":"Search Apex","target":1100},
    {"name":"Harun",  "fullName":"Harun",                      "id":"17299","team":"Search Apex","target":1100},
    {"name":"Babu",   "fullName":"Nishar Farazi Babu",         "id":"17317","team":"Search Apex","target":1100},
    {"name":"Akash",  "fullName":"ashiqur Rahaman",            "id":"17369","team":"Search Apex","target":1100},
    {"name":"Sifat",  "fullName":"M A Muyeed Sifat",           "id":"17246","team":"Search Apex","target":1100},
    {"name":"Imran",  "fullName":"Sheikh Al Imran",            "id":"17301","team":"Search Apex","target":1100},
    {"name":"Tihim",  "fullName":"Shihadul Islam Tihim",       "id":"17248","team":"Search Apex","target":1100},
    # Dark Rankers
    {"name":"Alamin", "fullName":"Al Amin",                    "id":"17236","team":"Dark Rankers","target":1100},
    {"name":"Ibrahim","fullName":"Ibrahim",                   "id":"17136","team":"Dark Rankers","target":1100},
    {"name":"Raj",    "fullName":"Atikuzzaman Raj",           "id":"17235","team":"Dark Rankers","target":1100},
    {"name":"Turjo",  "fullName":"Tohidul Islam Turjo",       "id":"17058","team":"Dark Rankers","target":1100},
    {"name":"Saiful", "fullName":"Saiful Islam Sagor",        "id":"17318","team":"Dark Rankers","target":1100},
    {"name":"Romjan", "fullName":"Md Romjanul Islam",         "id":"17233","team":"Dark Rankers","target":1100},
    {"name":"Istiak", "fullName":"Istiak",                    "id":"17238","team":"Dark Rankers","target":0},
]

# Set per-member target dynamically from team targets
for _m in ALL_MEMBERS: _m["target"] = MEM_TARGET

MEMBER_LOOKUP = {m["name"].strip().lower(): m["name"] for m in ALL_MEMBERS}

def normalize_assignee_token(token):
    token = re.sub(r"\([^)]*\)", "", token or "")
    token = re.sub(r"\b\d+%?\b", "", token)
    token = re.sub(r"%", "", token)  # remove leftover % after digit removal
    token = re.sub(r"\s+", " ", token).strip(" -")
    return token.strip()

def parse_assignees(assign_text):
    parts = [p.strip() for p in re.split(r"[/,]", assign_text or "")]
    exact = []
    seen = set()
    for part in parts:
        key = normalize_assignee_token(part).lower()
        if key in MEMBER_LOOKUP and key not in seen:
            exact.append(MEMBER_LOOKUP[key])
            seen.add(key)
    return exact
def get_members_from_sheet(sheet_id):
    """Fetch staff list from 'All Member Data' tab."""
    import time
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:json&sheet=All+Member+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode('utf-8')
            match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
            if not match: return []
            raw_data = json.loads(match.group(1))
            rows = raw_data['table']['rows']
            members = []
            for r in rows:
                c = r['c']
                if len(c) > 6 and c[2] and c[2]['v'] and c[6] and c[6]['v']:
                    members.append({
                        "name": str(c[2]['v']).strip(),
                        "fullName": str(c[1]['v']).strip() if c[1] else str(c[2]['v']),
                        "id": str(c[0]['f']) if c[0] and 'f' in c[0] else str(c[0]['v']) if c[0] else "",
                        "team": str(c[6]['v']).strip(),
                        "target": MEM_TARGET
                    })
            return members
    except:
        return []

def parse_gviz_date(val):
    val_str = str(val)
    if val_str.startswith('Date(') and val_str.endswith(')'):
        try:
            parts = val_str[5:-1].split(',')
            y, m, d = int(parts[0]), int(parts[1]) + 1, int(parts[2])
            return f"{y:04d}-{m:02d}-{d:02d}"
        except: pass
    return val_str

def get_public_sheet_data(sheet_id):
    """Fetch data specifically from 'Kam Data' sheet using Gviz."""
    import time
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:json&sheet=Kam+Data&t={int(time.time())}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', text)
        if not match: raise Exception("Failed to parse sheet JSON")
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
                            val = parse_gviz_date(c['v'])
                        elif 'f' in c and c['f'] is not None:
                            val = str(c['f'])
                    row_vals.append(val)
            processed_rows.append(row_vals)
        return processed_rows

def process_data(rows, member_list):
    if not rows: return []
    data_rows = rows[1:] # Skip header
    stats = {m["name"]: {**m, "wip":0,"revision":0,"delivered":0,"cancelled":0,
                             "total":0,"deliveredAmt":0.0,"wipAmt":0.0,"projects":[]}
                for m in member_list}

    def safe_float(val):
        try: return float(str(val).replace("$","").replace(",","").strip())
        except: return 0.0

    unique_orders = set()
    team_sums = {t: {"amt":0.0, "delivered":0, "wip":0, "projects":0} for t in MANAGEMENT["leaders"].keys()}

    for row in data_rows:
        while len(row) <= max(COL.values()): row.append("")
        assign  = str(row[COL["assign"]]).strip()
        status  = str(row[COL["status"]]).strip()
        service = str(row[COL["service"]]).strip().upper()
        
        # Filter for SEO and SMM
        if "SEO" not in service and "SMM" not in service:
            continue
            
        amt_x   = safe_float(row[COL["amount_x"]])
        order   = str(row[COL["order_num"]]).strip()
        link    = str(row[COL["order_link"]])
        client  = str(row[COL["client"]])
        date    = str(row[COL["date"]])[:10]
        del_date= str(row[COL["del_date"]])[:10]
        del_by  = str(row[COL["del_by"]])

        all_parts = [p.strip() for p in re.split(r"[/,]", assign or "")]
        unique_assignees = set()
        for p in all_parts:
            token = normalize_assignee_token(p).lower()
            if token: unique_assignees.add(token)
        
        # Share is divided equally among ALL people mentioned in the cell
        num_assigned = len(unique_assignees) if unique_assignees else 1
        share_x = round(amt_x / num_assigned, 2)

        matched_names = parse_assignees(assign)
        if not matched_names:
            continue

        matched_any = False
        row_teams = set()

        # Resolve del_by tag → team name for team amount credit
        del_by_team = None
        del_by_norm = str(del_by).lower().replace("_","").replace(" ","")
        for t_name in team_sums:
            if t_name.lower().replace(" ","") == del_by_norm:
                del_by_team = t_name
                break

        for name in matched_names:
            matched_any = True
            member = next((m for m in member_list if m["name"] == name), None)
            if member:
                row_teams.add(member["team"])
            proj = {
                "order": order, "link": link, "client": client,
                "assign": assign, "service": service, "status": status,
                "amtX": amt_x, "share": share_x, "date": date,
                "deliveredDate": del_date, "deliveredBy": del_by,
            }
            stats[name]["projects"].append(proj)
            stats[name]["total"] += 1
            if status == "Delivered":
                stats[name]["delivered"] += 1
                stats[name]["deliveredAmt"] += share_x
            elif status in ["WIP", "Revision"]:
                if status == "WIP": stats[name]["wip"] += 1
                else: stats[name]["revision"] += 1
                stats[name]["wipAmt"] += share_x
            elif status == "Cancelled":
                stats[name]["cancelled"] += 1

        if matched_any:
            if order and order != "N/A":
                unique_orders.add(order)
            
            # Team amount credit → Delivered By team gets full amt_x
            if del_by_team:
                if status == "Delivered":
                    team_sums[del_by_team]["amt"] += amt_x
                    team_sums[del_by_team]["delivered"] += 1
                elif status in ["WIP", "Revision"]:
                    team_sums[del_by_team]["wip"] += 1
                team_sums[del_by_team]["projects"] += 1
            else:
                # Fallback: split by member teams if del_by not matched
                for t in row_teams:
                    if status == "Delivered":
                        team_sums[t]["amt"] += amt_x / (len(row_teams) if row_teams else 1)
                        team_sums[t]["delivered"] += 1
                    elif status in ["WIP", "Revision"]:
                        team_sums[t]["wip"] += 1
                    team_sums[t]["projects"] += 1

    result = []
    total_delivered_amt = 0
    total_wip_amt = 0
    
    for m in ALL_MEMBERS:
        s = stats[m["name"]]
        target = s["target"]
        del_amt = round(s["deliveredAmt"], 2)
        total_delivered_amt += del_amt
        total_wip_amt += s["wipAmt"]
        
        result.append({
            "name": s["name"], "fullName": s["fullName"], "id": s["id"],
            "team": s["team"], "target": target, "total": s["total"],
            "wip": s["wip"], "revision": s["revision"], "delivered": s["delivered"],
            "cancelled": s["cancelled"], "deliveredAmt": del_amt,
            "wipAmt": round(s["wipAmt"], 2), "remaining": round(del_amt - target, 2),
            "progress": round((del_amt / target) * 100, 1) if target else 0,
            "projects": s["projects"],
        })
    
    # Final Summary with Dept and Team data
    team_data = []
    for t_name, t_info in team_sums.items():
        team_data.append({
            "teamName": t_name,
            "leader": MANAGEMENT["leaders"][t_name]["name"],
            "deliveredAmt": round(t_info["amt"], 2),
            "projects": t_info["projects"],
            "delivered": t_info["delivered"],
            "wip": t_info["wip"],
            "target": TEAM_TARGETS.get(t_name, 1100)
        })

    return {
        "members": result,
        "summary": {
            "dept": {
                "target": DEPT_TARGET,
                "achieved": round(total_delivered_amt, 2),
                "remaining": round(DEPT_TARGET - total_delivered_amt, 2),
                "progress": round((total_delivered_amt / DEPT_TARGET) * 100, 1) if DEPT_TARGET else 0,
                "uniqueProjects": len(unique_orders),
                "wipAmt": round(total_wip_amt, 2)
            },
            "teams": team_data,
            "management": MANAGEMENT
        }
    }

@app.route("/")
def index():
    return send_file(os.path.join(os.path.dirname(__file__), "geo_dashboard.html"))

@app.route("/api/data")
def api_data():
    global MEMBER_LOOKUP
    try:
        # 1. Fetch live members
        live_members = get_members_from_sheet(SHEET_ID)
        members_to_use = live_members if live_members else ALL_MEMBERS
        
        # 2. Update lookup for parse_assignees
        MEMBER_LOOKUP = {m["name"].strip().lower(): m["name"] for m in members_to_use}
        
        # 3. Fetch live projects
        rows = get_public_sheet_data(SHEET_ID)
        processed = process_data(rows, members_to_use)
        
        return jsonify({
            "status": "ok", 
            "mode": "live_public", 
            "data": processed["members"],
            "summary": processed["summary"],
            "rowCount": len(rows),
            "memberCount": len(members_to_use)
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/status")
def api_status():
    return jsonify({"status": "running", "sheetId": SHEET_ID, "mode": "Public Live (Kam Data)"})

if __name__ == "__main__":
    app.run(debug=False, port=5000)
