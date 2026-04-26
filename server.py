import json, os, urllib.request, re, time, calendar
from datetime import datetime, timezone, timedelta
from flask import Flask, jsonify, send_file, request, render_template
from flask_cors import CORS
import agent_engine
from shared_utils import (
    SHEET_ID, QUERY_SHEET_ID, MONGO_URI, DB_NAME, DEPT_TARGET, MEM_TARGET, TEAM_TARGETS, MANAGEMENT, COL,
    get_db, parse_gviz_date, normalize_assignee_token, get_members_from_db, fetch_sheet_data_gviz
)

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/delivery-tracker")
def delivery_tracker():
    return render_template("delivery-tracker.html")

@app.route("/employee")
def employee_dashboard():
    return render_template("employee-dashboard.html")

@app.route("/api/sync")
def api_sync():
    """Manually trigger data recalculation (Full Dashboard)."""
    try:
        agent_engine.calculate_summaries()
        return jsonify({"status": "ok", "message": "Manual sync completed. Database updated."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/data")
def api_data():
    """Main Dashboard: Instant load from MongoDB summaries only, merged with member profiles."""
    try:
        db = get_db()
        dept_sum_doc = db["dept_summary"].find_one({"_id": "current_stats"})
        team_sum_doc = db["team_summaries"].find_one({"_id": "current_stats"})
        member_docs   = list(db["member_summaries"].find({}, {"_id": 0}))
        
        # Merge target/name/role from 'members' collection
        members_profiles = {m["id"]: m for m in db["members"].find()}
        for m in member_docs:
            prof = members_profiles.get(m.get("id"))
            if prof:
                if "target" in prof: m["target"] = prof["target"]
                if "name" in prof: m["name"] = prof["name"]
                if "role" in prof: m["role"] = prof["role"]
                if "team" in prof: m["team"] = prof["team"]
        
        # Recalculate team targets based on updated members
        if team_sum_doc and "teams" in team_sum_doc:
            for team_name, team_data in team_sum_doc["teams"].items():
                team_target = 0
                for tm in team_data.get("members", []):
                    prof = members_profiles.get(tm.get("id"))
                    if prof and "target" in prof: tm["target"] = prof["target"]
                    if prof and "name" in prof: tm["name"] = prof["name"]
                    team_target += tm.get("target", 1100)
                team_data["target"] = team_target
                team_data["progress"] = min(100, round((team_data.get("stats",{}).get("deliveredAmt",0) / team_target * 100))) if team_target > 0 else 0
        
        if not dept_sum_doc:
            return jsonify({"status": "syncing", "message": "Database initializing..."})

        summary = {
            "dept": dept_sum_doc or {},
            "teams": team_sum_doc.get("teams", {}) if team_sum_doc else {},
            "totalAchieved": dept_sum_doc.get("achieved", 0),
            "totaleOrders": dept_sum_doc.get("uniqueProjects", 0),
            "audit": {
                "seoSmmRows": dept_sum_doc.get("seoSmmRows", 0),
                "matchedRows": dept_sum_doc.get("matchedRows", 0),
                "unmatchedRows": dept_sum_doc.get("unmatchedRows", 0),
                "uniqueOrders": dept_sum_doc.get("uniqueProjects", 0),
                "unmatchedItems": []
            }
        }
        return jsonify({
            "status": "ok", "data": member_docs, "summary": summary, "audit": summary["audit"],
            "projectCount": summary["uniqueOrders"], "memberCount": len(member_docs),
            "lastSync": dept_sum_doc.get("last_updated", 0)
        })
    except Exception as e:
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

def get_month_working_stats(db):
    """Calculates total weekdays and elapsed working days in the current month."""
    from datetime import datetime
    now = datetime.now()
    year, month = now.year, now.month
    
    config = db["settings"].find_one({"_id": "calendar_config"}) or {}
    total_days = 0
    if config and str(year) in config and str(month) in config[str(year)]:
        total_days = int(config[str(year)][str(month)])
    else:
        num_days = calendar.monthrange(year, month)[1]
        for day in range(1, num_days + 1):
            if datetime(year, month, day).weekday() < 5: # Mon-Fri
                total_days += 1

    elapsed = 0
    for day in range(1, now.day + 1):
        if datetime(year, month, day).weekday() < 5:
            elapsed += 1
            
    return total_days, min(elapsed, total_days)

def calculate_monthly_working_days(db):
    total, _ = get_month_working_stats(db)
    return total

@app.route("/api/login", methods=["POST"])
def api_login():
    try:
        data = request.get_json(force=True)
        emp_id = str(data.get("id", "")).strip()
        password = data.get("password", "")
        db = get_db()
        
        # Check both exactly typed ID and the float version potentially synced from Sheets (e.g. 17236 vs 17236.0)
        member = db["members"].find_one({"id": {"$in": [emp_id, f"{emp_id}.0"]}})

        # If the member exists but doesn't have a password field in the DB yet, fallback to default 'pass123'
        if member:
            emp_id = member["id"]  # Use the DB's official ID key for subsequent queries
            stored_pass = member.get("password") or "pass123"
            if stored_pass == password:
                sum_doc = db["member_summaries"].find_one({"id": emp_id}, {"_id": 0})
                # Explicitly grant admin access to the specified IDs
                admin_ids = ["17149", "17137", "17248", "17238"]
                current_id_str = str(member.get("id")).split('.')[0]
                is_admin = "Manager" in member.get("role", "") or "Leader" in member.get("role", "") or member.get("isAdmin", False) or current_id_str in admin_ids

                if not sum_doc: sum_doc = {**member, "deliveredAmt": 0, "wipAmt": 0, "projects": [], "progress": 0}
                tot_days, elap_days = get_month_working_stats(db)
                res = {
                    "password": member.get("password", "pass123"),
                    "profile": {
                        "id": member["id"], "name": member.get("name", ""), "fullName": member.get("fullName", ""),
                        "role": member.get("role", "Member"), "department": member.get("team", ""),
                        "email": member.get("email", ""), "phone": member.get("phone", ""),
                        "joinDate": member.get("joinDate", ""), "manager": member.get("manager", ""),
                        "avatar": member.get("name", "?")[0], "avatarColor": "linear-gradient(135deg,#0f766e,#0d9488)",
                        "employmentType": "Full-Time", "target": sum_doc.get("target", 1100),
                        "isAdmin": is_admin
                    },
                    "stats": {
                        "workingDays": tot_days, "elapsedDays": elap_days, "deliveredAmt": sum_doc.get("deliveredAmt", 0),
                        "wipAmt": sum_doc.get("wipAmt", 0), "present": sum_doc.get("delivered", 0),
                        "leaveBalance": {
                            "annual": {"label": "Annual Leave", "total": 15, "used": 2, "remaining": 13, "color": "#3b82f6"},
                            "sick": {"label": "Sick Leave", "total": 10, "used": 0, "remaining": 10, "color": "#10b981"}
                        }
                    },
                    "projects": sum_doc.get("projects", []),
                    "performance": [
                        {"label": "Target Progress", "value": sum_doc.get("progress", 0), "target": 100, "unit": "%", "color": "#0f766e"}
                    ]
                }
                return jsonify({"status": "ok", "user": res})
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route("/api/attendance", methods=["GET"])
def get_attendance():
    """Fetch attendance records for a specific employee from MongoDB."""
    emp_id = request.args.get("id")
    if not emp_id: return jsonify({"error": "id required"}), 400
    try:
        db = get_db()
        # Fetch records sorted by date descending for the specific employee
        docs = list(db["attendance"].find({"emp_id": emp_id}, {"_id": 0}).sort("date", -1))
        return jsonify(docs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/attendance", methods=["POST"])
def save_attendance():
    """Update or insert a check-in/out record in MongoDB using SERVER time."""
    try:
        data = request.get_json(force=True)
        emp_id = data.get("emp_id")
        if not emp_id: return jsonify({"error": "invalid data"}), 400
        
        db = get_db()
        tz_bd = timezone(timedelta(hours=6))
        now = datetime.now(tz_bd)
        today_str = now.strftime('%Y-%m-%d')
        time_str = now.strftime('%I:%M %p')
        ip = request.remote_addr
        
        is_checkin = "in" in data
        existing = db["attendance"].find_one({"emp_id": emp_id, "date": today_str})
        
        if is_checkin:
            if existing and existing.get("in"):
                return jsonify({"error": "Already checked in today"}), 400
                
            cutoff = now.replace(hour=9, minute=15, second=0, microsecond=0)
            status = "Late" if now > cutoff else "Present"
            
            update_doc = {
                "in": time_str,
                "ip_in": ip,
                "status": status,
                "date": today_str,
                "emp_id": emp_id
            }
            db["attendance"].update_one({"emp_id": emp_id, "date": today_str}, {"$set": update_doc}, upsert=True)
            return jsonify({"ok": True, "time": time_str, "status": status})
            
        else: # check-out
            if not existing or not existing.get("in"):
                return jsonify({"error": "Must check in first"}), 400
            if existing.get("out"):
                return jsonify({"error": "Already checked out"}), 400
                
            in_time_str = existing["in"]
            in_time = datetime.strptime(in_time_str, '%I:%M %p').time()
            in_dt = now.replace(hour=in_time.hour, minute=in_time.minute, second=0, microsecond=0)
            duration = now - in_dt
            hours = duration.seconds // 3600
            minutes = (duration.seconds % 3600) // 60
            duration_str = f"{hours}h {minutes}m"
            
            update_doc = {
                "out": time_str,
                "ip_out": ip,
                "duration": duration_str
            }
            db["attendance"].update_one({"emp_id": emp_id, "date": today_str}, {"$set": update_doc})
            return jsonify({"ok": True, "time": time_str, "duration": duration_str})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    emp_id = request.args.get("id")
    if not emp_id: return jsonify([]), 400
    db = get_db()
    notifs = list(db["notifications"].find({"$or": [{"emp_id": emp_id}, {"emp_id": "all"}]}, {"_id": 0}).sort("timestamp", -1).limit(20))
    return jsonify(notifs)

@app.route("/api/notifications/mark-read", methods=["POST"])
def mark_notifs_read():
    data = request.get_json(force=True)
    emp_id = data.get("id")
    if not emp_id: return jsonify({"error": "missing id"}), 400
    db = get_db()
    db["notifications"].update_many({"emp_id": emp_id, "read": False}, {"$set": {"read": True}})
    return jsonify({"ok": True})

@app.route("/api/user/update", methods=["POST"])
def update_user_profile():
    data = request.get_json(force=True)
    emp_id = data.get("id")
    if not emp_id: return jsonify({"error": "missing id"}), 400
    db = get_db()
    allowed_fields = ["phone", "email", "fullName", "password"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    if update_data:
        db["members"].update_one({"id": emp_id}, {"$set": update_data})
        return jsonify({"ok": True})
    return jsonify({"error": "no valid fields to update"}), 400

@app.route("/api/admin/members", methods=["GET"])
def admin_get_members():
    db = get_db()
    members = list(db["members"].find({}, {"_id": 0}))
    return jsonify(members)

@app.route("/api/admin/members/update", methods=["POST"])
def admin_update_member():
    data = request.get_json(force=True)
    emp_id = data.get("id")
    if not emp_id: return jsonify({"error": "missing id"}), 400
    db = get_db()
    # Allow updating more fields in admin mode
    allowed_fields = ["name", "fullName", "role", "team", "target", "email", "phone", "isAdmin"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    db["members"].update_one({"id": emp_id}, {"$set": update_data})
    return jsonify({"ok": True})

@app.route("/api/admin/members/add", methods=["POST"])
def admin_add_member():
    data = request.get_json(force=True)
    if not data.get("id") or not data.get("name"): return jsonify({"error": "missing data"}), 400
    db = get_db()
    db["members"].insert_one(data)
    return jsonify({"ok": True})

@app.route("/api/admin/members/delete", methods=["POST"])
def admin_delete_member():
    data = request.get_json(force=True)
    emp_id = data.get("id")
    if not emp_id: return jsonify({"error": "missing id"}), 400
    db = get_db()
    db["members"].delete_one({"id": emp_id})
    return jsonify({"ok": True})

@app.route("/api/admin/attendance", methods=["GET"])
def admin_get_all_attendance():
    db = get_db()
    date_str = request.args.get("date", datetime.now(timezone(timedelta(hours=6))).strftime('%Y-%m-%d'))
    records = list(db["attendance"].find({"date": date_str}, {"_id": 0}))
    return jsonify(records)

@app.route("/api/admin/attendance/update", methods=["POST"])
def admin_update_attendance():
    data = request.get_json(force=True)
    emp_id = data.get("emp_id")
    date_str = data.get("date")
    if not emp_id or not date_str: return jsonify({"error": "missing data"}), 400
    db = get_db()
    update_data = {k: v for k, v in data.items() if k in ["in", "out", "status", "duration"]}
    db["attendance"].update_one({"emp_id": emp_id, "date": date_str}, {"$set": update_data})
    return jsonify({"ok": True})

@app.route("/api/admin/calendar-config", methods=["GET", "POST"])
def admin_calendar_config():
    """Manage custom working days/holidays per month."""
    db = get_db()
    if request.method == "GET":
        try:
            config = db["settings"].find_one({"_id": "calendar_config"})
            return jsonify(config or {"_id": "calendar_config"})
        except Exception as e: return jsonify({"error": str(e)}), 500
    
    if request.method == "POST":
        try:
            data = request.get_json(force=True)
            if "_id" in data: del data["_id"]
            db["settings"].update_one(
                {"_id": "calendar_config"},
                {"$set": data},
                upsert=True
            )
            return jsonify({"ok": True})
        except Exception as e: return jsonify({"error": str(e)}), 500

@app.route("/api/delivered-projects")
def get_delivered_from_db():
    """Default: Load delivered projects instantly from MongoDB Archive."""
    try:
        db = get_db()
        projects = list(db["projects_archive"].find({"status": "Delivered"}, {"_id": 0}).sort("date", -1))
        return jsonify(projects)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/sync-delivered")
def sync_delivered():
    """Manual: Force pull from Sheets, Update Archive, then return data."""
    try:
        agent_engine.calculate_summaries() 
        return get_delivered_from_db()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def background_sync_task():
    """Polls Google Sheets every 10 minutes to keep Database Archive fresh."""
    while True:
        try:
            print("Background Sync: Updating Database from Google Sheets...")
            agent_engine.calculate_summaries()
            print("Background Sync: Complete.")
        except Exception as e:
            print(f"Background Sync Error: {e}")
        time.sleep(600)

import threading
threading.Thread(target=background_sync_task, daemon=True).start()

@app.route("/api/months")
def get_archive_months():
    """Returns a unique list of YYYY-MM months found in the archive."""
    try:
        db = get_db()
        # Get unique months from the archive
        months = db["projects_archive"].distinct("month")
        # Filter out invalid entries and sort descending
        valid_months = sorted([m for m in months if m and len(m) == 7], reverse=True)
        return jsonify(valid_months)
    except Exception as e:
        return jsonify([])

@app.route("/query-tracker")
def query_tracker():
    return render_template("query-tracker.html")

@app.route("/api/query-tracker")
def api_query_tracker():
    try:
        from datetime import datetime
        month_filter = request.args.get("month", datetime.now().strftime("%Y-%m"))
        force_refresh = request.args.get("refresh", "false").lower() == "true"
        
        db = get_db()
        queries_collection = db["queries_archive"]
        
        # If force_refresh is true or the collection is completely empty, fetch from Google Sheet
        if force_refresh or queries_collection.count_documents({}) == 0:
            rows = fetch_sheet_data_gviz("Query Sheet", QUERY_SHEET_ID)
            if rows:
                q_batch = []
                for r in rows[1:]: # Skip header
                    if len(r) < 5: continue
                    while len(r) < 15: r.append("")
                    date_val = str(r[0]).strip()
                    member = str(r[1]).strip()
                    client = str(r[3]).strip()
                    key = f"{client}_{member}_{date_val}"
                    doc = {
                        "key": key, "date": date_val, "member": member, "profile": str(r[2]).strip(),
                        "client": client, "service": str(r[4]).strip(), "inboxUrl": str(r[5]).strip() if len(r) > 5 else "",
                        "sheetRemarks": str(r[6]).strip() if len(r) > 6 else "", "source": str(r[7]).strip() if len(r) > 7 else "",
                        "status": str(r[8]).strip() if len(r) > 8 else "", "fu1": str(r[9]).strip() if len(r) > 9 else "",
                        "fu2": str(r[10]).strip() if len(r) > 10 else "", "fu3": str(r[11]).strip() if len(r) > 11 else "",
                        "convUrl": str(r[12]).strip() if len(r) > 12 else "", "briefUrl": str(r[13]).strip() if len(r) > 13 else "",
                        "convStatus": str(r[14]).strip() if len(r) > 14 else "",
                        "month": date_val[:7] if len(date_val) >= 7 else "Unknown",
                        "updated_at": time.time()
                    }
                    from pymongo import UpdateOne
                    q_batch.append(UpdateOne({"key": key}, {"$set": doc}, upsert=True))
                if q_batch:
                    queries_collection.bulk_write(q_batch)
                    
        # Serve data from MongoDB filtered by month
        query = {}
        if month_filter:
            query = {"month": month_filter}
            
        data = list(queries_collection.find(query, {"_id": 0}))
        
        # Merge with local remarks
        local_remarks = list(db["query_remarks"].find({}, {"_id": 0}))
        rem_dict = {item["key"]: item["remark"] for item in local_remarks}
        
        for item in data:
            item["localRemark"] = rem_dict.get(item["key"], "")
            item["rowKey"] = item["key"]
            
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/query-remarks", methods=["POST"])
def save_query_remark():
    try:
        data = request.get_json(force=True)
        if not data or not data.get("key"):
            return jsonify({"error": "key required"}), 400
        db = get_db()
        db["query_remarks"].update_one(
            {"key": data["key"]}, 
            {"$set": {"remark": data.get("remark", ""), "updated_at": time.time()}}, 
            upsert=True
        )
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/status")
def api_status():
    return jsonify({"status": "running", "sheetId": SHEET_ID})

import threading

def start_background_sync():
    def run_sync_loop():
        import sync_mongo
        while True:
            # Wait 10 minutes before running next scheduled sync
            # Sleep first to avoid running immediately on boot since we rely on DB mostly
            time.sleep(600) 
            try:
                print("⏳ Running automated background sync (10-min interval)...")
                sync_mongo.sync()
            except Exception as e:
                print(f"❌ Background scheduler error: {e}")

    # Only start the thread in the main process (avoids duplicates in debug mode)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        t = threading.Thread(target=run_sync_loop, daemon=True)
        t.start()

if __name__ == "__main__":
    start_background_sync()
    app.run(host="0.0.0.0", port=5000, debug=True)
