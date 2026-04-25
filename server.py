import json, os, urllib.request, re, time
from flask import Flask, jsonify, send_file, request, render_template
from flask_cors import CORS
import agent_engine
from shared_utils import (
    SHEET_ID, MONGO_URI, DB_NAME, DEPT_TARGET, MEM_TARGET, TEAM_TARGETS, MANAGEMENT, COL,
    get_db, parse_gviz_date, normalize_assignee_token, get_members_from_db, fetch_sheet_data_gviz
)

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# Sheet team tag → dashboard team name mapping
TEAM_TAG_MAP = {
    "GEO Rankers":  "Geo_Rankers",
    "Rank Riser":   "Rank_Riser",
    "Search Apex":  "Search_Apex",
    "SMM": "SMM",
}

def get_current_members():
    """Fetch members from DB, fallback to sheet, then fallback to empty list."""
    members = get_members_from_db()
    if not members:
        # Fallback to fetching from sheet if DB is empty
        rows = fetch_sheet_data_gviz("All Member Data")
        if rows:
            for r in rows:
                if len(r) > 6 and r[2] and r[6]:
                    members.append({
                        "name": str(r[2]).strip(),
                        "fullName": str(r[1]).strip() if len(r)>1 else str(r[2]),
                        "id": str(r[0]).strip(),
                        "team": str(r[6]).strip(),
                        "target": MEM_TARGET()
                    })
    else:
        # Add target if missing from DB
        for m in members:
            if "target" not in m: m["target"] = MEM_TARGET()
    return members

def get_member_lookup(members):
    lookup = {m["name"].strip().lower(): m["name"] for m in members}
    lookup["istak"] = "Istiak" 
    lookup["istak ahamed"] = "Istiak"
    return lookup

def parse_assignees(assign_text, lookup):
    parts = [p.strip() for p in re.split(r"[/,]", assign_text or "")]
    exact = []
    seen = set()
    for part in parts:
        key = normalize_assignee_token(part).lower()
        if key in lookup and key not in seen:
            exact.append(lookup[key])
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
                        "target": MEM_TARGET()
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

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/delivery-tracker")
def delivery_tracker():
    return render_template("delivery-tracker.html")

@app.route("/api/sync")
def api_sync():
    """Manually trigger data recalculation."""
    try:
        agent_engine.calculate_summaries()
        return jsonify({"status": "ok", "message": "Sync completed successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/data")
def api_data():
    try:
        db = get_db()
        
        # 1. Fetch pre-calculated summaries
        dept_sum_doc = db["dept_summary"].find_one({"_id": "current_stats"})
        team_sum_doc = db["team_summaries"].find_one({"_id": "current_stats"})
        member_docs   = list(db["member_summaries"].find({}, {"_id": 0}))
        
        # Fallback if DB hasn't been recalculated yet
        if not dept_sum_doc or not team_sum_doc or not member_docs:
            print("Summary tables empty. Attempting live recalculation...")
            agent_engine.calculate_summaries()
            dept_sum_doc = db["dept_summary"].find_one({"_id": "current_stats"})
            team_sum_doc = db["team_summaries"].find_one({"_id": "current_stats"})
            member_docs   = list(db["member_summaries"].find({}, {"_id": 0}))

        summary = {
            "dept": dept_sum_doc or {},
            "teams": team_sum_doc.get("teams", {}) if team_sum_doc else {},
            "totalAchieved": dept_sum_doc.get("achieved", 0) if dept_sum_doc else 0,
            "totalWip": dept_sum_doc.get("wipAmt", 0) if dept_sum_doc else 0,
            "seoSmmRows": dept_sum_doc.get("seoSmmRows", 0) if dept_sum_doc else 0,
            "wipRows": dept_sum_doc.get("wipRows", 0) if dept_sum_doc else 0,
            "cancelledRows": dept_sum_doc.get("cancelledRows", 0) if dept_sum_doc else 0,
            "unmatchedRows": dept_sum_doc.get("unmatchedRows", 0) if dept_sum_doc else 0,
            "uniqueOrders": dept_sum_doc.get("uniqueProjects", 0) if dept_sum_doc else 0,
            "audit": {
                "seoSmmRows": dept_sum_doc.get("seoSmmRows", 0) if dept_sum_doc else 0,
                "matchedRows": dept_sum_doc.get("matchedRows", 0) if dept_sum_doc else 0,
                "unmatchedRows": dept_sum_doc.get("unmatchedRows", 0) if dept_sum_doc else 0,
                "uniqueOrders": dept_sum_doc.get("uniqueProjects", 0) if dept_sum_doc else 0,
                "unmatchedItems": [] # Handled by specialized audit tools
            }
        }
        
        return jsonify({
            "status": "ok", 
            "mode": "mongodb_atlas_summary_table", 
            "data": member_docs,
            "summary": summary,
            "audit": summary["audit"],
            "projectCount": summary["uniqueOrders"],
            "memberCount": len(member_docs),
            "lastSync": dept_sum_doc.get("last_updated", 0) if dept_sum_doc else 0
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/followups", methods=["GET"])
def get_followups():
    try:
        db = get_db()
        docs = list(db["follow_ups"].find({}, {"_id": 0}))
        return jsonify(docs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/followups", methods=["POST"])
def save_followup():
    try:
        data = request.get_json(force=True)
        if not data or not data.get("key"):
            return jsonify({"error": "key required"}), 400
        db = get_db()
        data["updated_at"] = time.time()
        db["follow_ups"].update_one({"key": data["key"]}, {"$set": data}, upsert=True)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/templates", methods=["GET"])
def get_templates():
    try:
        db = get_db()
        doc = db["settings"].find_one({"_id": "message_templates"})
        if not doc:
            return jsonify({
                "1": "Hi! Your project has been successfully delivered.\n\nOrder: {order}\nService: {service}\n\nPlease review and let us know your feedback! 🙏",
                "2": "Hi! Checking in again regarding your delivery (Order: {order}).\n\nDid everything meet your expectations? Let us know if you need anything!",
                "3": "Hi! Checking in (3rd follow-up) for Order: {order}.\n\nWe want to ensure you're satisfied. Please let us know if there's anything to review!",
                "4": "Hi! Just following up (4th time) on Order: {order}.\n\nCould you please take a moment to confirm everything is in order?",
                "5": "Hi! Final follow-up for Order: {order}.\n\nPlease let us know if you have any last concerns. Thank you for your trust! 🙏"
            })
        return jsonify(doc.get("templates", {}))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/templates", methods=["POST"])
def save_template():
    try:
        data = request.get_json(force=True)
        if not data: return jsonify({"error": "data required"}), 400
        db = get_db()
        db["settings"].update_one(
            {"_id": "message_templates"}, 
            {"$set": {"templates": data, "updated_at": time.time()}}, 
            upsert=True
        )
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/delivered-projects")
def get_delivered_from_db():
    """Default: Load delivered projects instantly from MongoDB Archive."""
    try:
        db = get_db()
        # Return projects from the permanent archive
        projects = list(db["projects_archive"].find({"status": "Delivered"}, {"_id": 0}).sort("date", -1))
        return jsonify(projects)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/sync-delivered")
def sync_delivered():
    """Manual: Force pull from Sheets, Update Archive, then return data."""
    try:
        # 1. Trigger the logic engine to fetch and archive
        agent_engine.calculate_summaries() 
        # 2. Return the freshly updated data from DB
        return get_delivered_from_db()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── BACKGROUND SYNC ──
def background_sync_task():
    """Polls Google Sheets every 10 minutes to keep Database Archive fresh."""
    while True:
        try:
            print("Background Sync: Updating Database from Google Sheets...")
            agent_engine.calculate_summaries()
            print("Background Sync: Complete.")
        except Exception as e:
            print(f"Background Sync Error: {e}")
        time.sleep(600) # 10 minutes

import threading
threading.Thread(target=background_sync_task, daemon=True).start()

@app.route("/api/status")
def api_status():
    return jsonify({"status": "running", "sheetId": SHEET_ID, "mode": "Public Live (Kam Data)"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
