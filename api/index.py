import gzip, json, os, urllib.request, re, time, calendar
from datetime import datetime, timezone, timedelta
from flask import Flask, jsonify, send_file, request, render_template
from flask_cors import CORS
from bson import ObjectId

class MongoJsonProvider(Flask.json_provider_class):
    def dumps(self, obj, **kwargs):
        def default(o):
            if isinstance(o, ObjectId): return str(o)
            if isinstance(o, (datetime,)): return o.isoformat()
            raise TypeError(f"Object of type {type(o)} is not JSON serializable")
        return json.dumps(obj, default=default, **kwargs)
    def loads(self, s, **kwargs):
        return json.loads(s, **kwargs)
import agent_engine
from shared_utils import (
    SHEET_ID, QUERY_SHEET_ID, MONGO_URI, DB_NAME, DEPT_TARGET, MEM_TARGET, TEAM_TARGETS, MANAGEMENT, COL,
    get_db, parse_gviz_date, normalize_assignee_token, get_members_from_db, fetch_sheet_data_gviz
)

import os
base_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dist = os.path.abspath(os.path.join(base_dir, "..", "frontend", "dist"))

app = Flask(__name__,
            template_folder=frontend_dist,
            static_folder=os.path.join(frontend_dist, "assets"),
            static_url_path='/assets')
app.json_provider_class = MongoJsonProvider
app.json = MongoJsonProvider(app)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 86400
CORS(app)

API_CACHE_TTL = 15
_api_cache = {}

def clear_api_cache():
    _api_cache.clear()

def cached_json(key, ttl, builder):
    now = time.time()
    item = _api_cache.get(key)
    if item and now - item["time"] < ttl:
        resp = jsonify(item["data"])
        resp.headers["X-Cache"] = "HIT"
        return resp
    data = builder()
    _api_cache[key] = {"time": now, "data": data}
    resp = jsonify(data)
    resp.headers["X-Cache"] = "MISS"
    return resp

@app.after_request
def add_perf_headers(response):
    # GZIP disabled temporarily to debug hang
    return response

@app.route("/")
@app.route("/delivery-tracker")
@app.route("/employee")
@app.route("/query-tracker")
def index():
    return render_template("index.html")

@app.route("/api/sync")
def api_sync():
    """Manually trigger data recalculation (Full Dashboard)."""
    try:
        agent_engine.calculate_summaries()
        clear_api_cache()
        return jsonify({"status": "ok", "message": "Manual sync completed. Database updated."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/data")
def api_data():
    """Main Dashboard: Instant load from MongoDB summaries only, merged with member profiles."""
    try:
        def build_payload():
            db = get_db()
            dept_sum_doc = db["dept_summary"].find_one({"_id": "current_stats"})
            team_sum_doc = db["team_summaries"].find_one({"_id": "current_stats"})
            member_docs = list(db["member_summaries"].find({}, {"_id": 0}))

            ADMIN_IDS = {"17149", "17137", "17248", "17238"}

            def clean_id(raw):
                s = str(raw) if raw is not None else ""
                return s[:-2] if s.endswith(".0") else s

            members_profiles = {clean_id(m["id"]): m for m in db["members"].find({}, {"_id": 0}) if m.get("id")}
            for m in member_docs:
                m["id"] = clean_id(m.get("id", ""))
                prof = members_profiles.get(m["id"])
                if prof:
                    if "target" in prof: m["target"] = prof["target"]
                    if "name" in prof: m["name"] = prof["name"]
                    if "role" in prof: m["role"] = prof["role"]
                    if "team" in prof: m["team"] = prof["team"]
                m["isAdmin"] = m["id"] in ADMIN_IDS or "Manager" in m.get("role", "") or "Leader" in m.get("role", "")

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
                return {"status": "syncing", "message": "Database initializing..."}

            summary = {
                "dept": dept_sum_doc or {},
                "teams": team_sum_doc.get("teams", {}) if team_sum_doc else {},
                "totalAchieved": dept_sum_doc.get("achieved", 0),
                "totaleOrders": dept_sum_doc.get("uniqueProjects", 0),
                "uniqueOrders": dept_sum_doc.get("uniqueProjects", 0),
                "audit": {
                    "seoSmmRows": dept_sum_doc.get("seoSmmRows", 0),
                    "matchedRows": dept_sum_doc.get("matchedRows", 0),
                    "unmatchedRows": dept_sum_doc.get("unmatchedRows", 0),
                    "uniqueOrders": dept_sum_doc.get("uniqueProjects", 0),
                    "unmatchedItems": []
                }
            }
            return {
                "status": "ok", "data": member_docs, "summary": summary, "audit": summary["audit"],
                "projectCount": summary["uniqueOrders"], "memberCount": len(member_docs),
                "lastSync": dept_sum_doc.get("last_updated", 0)
            }

        return cached_json("api_data", API_CACHE_TTL, build_payload)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/data-live")
def api_data_live():
    """Uncached copy kept for debugging."""
    try:
        db = get_db()
        dept_sum_doc = db["dept_summary"].find_one({"_id": "current_stats"})
        team_sum_doc = db["team_summaries"].find_one({"_id": "current_stats"})
        member_docs   = list(db["member_summaries"].find({}, {"_id": 0}))
        
        # Merge target/name/role from 'members' collection
        def _cid(v): s=str(v) if v else ""; return s[:-2] if s.endswith(".0") else s
        members_profiles = {_cid(m["id"]): m for m in db["members"].find() if m.get("id")}
        for m in member_docs:
            m["id"] = _cid(m.get("id", ""))
            prof = members_profiles.get(m["id"])
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

def audit_log(db, action, detail="", actor="admin"):
    try:
        db["audit_logs"].insert_one({
            "action": action,
            "detail": detail,
            "actor": actor,
            "timestamp": time.time()
        })
    except Exception:
        pass

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

@app.route("/api/attendance-stats")
def attendance_stats():
    """Return late/absent count + today's in-time for all members."""
    try:
        db = get_db()
        today = datetime.now(timezone(timedelta(hours=6))).strftime('%Y-%m-%d')
        docs = list(db["attendance"].find({}, {"_id": 0, "emp_id": 1, "status": 1, "date": 1, "in": 1}))
        stats = {}
        for d in docs:
            raw = str(d.get("emp_id", ""))
            eid = raw[:-2] if raw.endswith(".0") else raw
            if eid not in stats:
                stats[eid] = {"late": 0, "absent": 0, "today_in": None}
            s = d.get("status", "")
            if s == "Late":   stats[eid]["late"]   += 1
            if s == "Absent": stats[eid]["absent"] += 1
            if d.get("date") == today and d.get("in"):
                stats[eid]["today_in"] = d["in"]
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
    db["notifications"].update_many({"emp_id": {"$in": [emp_id, "all"]}, "read": False}, {"$set": {"read": True}})
    return jsonify({"ok": True})

@app.route("/api/leave-requests", methods=["GET", "POST"])
def leave_requests():
    db = get_db()
    if request.method == "GET":
        emp_id = request.args.get("id")
        query = {"emp_id": emp_id} if emp_id else {}
        docs = list(db["leave_requests"].find(query, {"_id": 0}).sort("created_at", -1).limit(50))
        return jsonify(docs)

    data = request.get_json(force=True)
    emp_id = data.get("emp_id")
    if not emp_id: return jsonify({"error": "emp_id required"}), 400
    doc = {
        "key": f"{emp_id}_{int(time.time() * 1000)}",
        "emp_id": emp_id,
        "name": data.get("name", ""),
        "type": data.get("type", "Annual"),
        "from": data.get("from", ""),
        "to": data.get("to", ""),
        "reason": data.get("reason", ""),
        "status": "Pending",
        "created_at": time.time()
    }
    db["leave_requests"].insert_one(doc)
    audit_log(db, "leave_requested", f"{doc['name'] or emp_id} requested {doc['type']} leave")
    return jsonify({"ok": True, "request": {k: v for k, v in doc.items() if k != "_id"}})

@app.route("/api/attendance-corrections", methods=["GET", "POST"])
def attendance_corrections():
    db = get_db()
    if request.method == "GET":
        emp_id = request.args.get("id")
        query = {"emp_id": emp_id} if emp_id else {}
        docs = list(db["attendance_corrections"].find(query, {"_id": 0}).sort("created_at", -1).limit(50))
        return jsonify(docs)

    data = request.get_json(force=True)
    emp_id = data.get("emp_id")
    if not emp_id: return jsonify({"error": "emp_id required"}), 400
    doc = {
        "key": f"cor_{emp_id}_{int(time.time() * 1000)}",
        "emp_id": emp_id,
        "name": data.get("name", ""),
        "date": data.get("date", ""),
        "in": data.get("in", ""),
        "out": data.get("out", ""),
        "reason": data.get("reason", ""),
        "status": "Pending",
        "created_at": time.time()
    }
    db["attendance_corrections"].insert_one(doc)
    audit_log(db, "attendance_correction_requested", f"{doc['name'] or emp_id} requested correction for {doc['date']}")
    return jsonify({"ok": True})

@app.route("/api/daily-reports", methods=["GET", "POST"])
def daily_reports():
    db = get_db()
    if request.method == "GET":
        emp_id = request.args.get("id")
        query = {"emp_id": emp_id} if emp_id else {}
        docs = list(db["daily_reports"].find(query, {"_id": 0}).sort("date", -1).limit(80))
        return jsonify(docs)

    data = request.get_json(force=True)
    emp_id = data.get("emp_id")
    date_str = data.get("date") or datetime.now(timezone(timedelta(hours=6))).strftime("%Y-%m-%d")
    if not emp_id: return jsonify({"error": "emp_id required"}), 400
    doc = {
        "key": f"{emp_id}_{date_str}",
        "emp_id": emp_id,
        "name": data.get("name", ""),
        "date": date_str,
        "summary": data.get("summary", ""),
        "blockers": data.get("blockers", ""),
        "hours": data.get("hours", ""),
        "created_at": time.time()
    }
    db["daily_reports"].update_one({"key": doc["key"]}, {"$set": doc}, upsert=True)
    audit_log(db, "daily_report_submitted", f"{doc['name'] or emp_id} submitted report for {date_str}")
    return jsonify({"ok": True})

@app.route("/api/team-leaderboard")
def team_leaderboard():
    emp_id = request.args.get("id", "")
    db = get_db()
    member = db["members"].find_one({"id": {"$in": [emp_id, f"{emp_id}.0"]}}, {"_id": 0})
    if not member: return jsonify({"team": "", "members": []})
    team = member.get("team", "")
    team_members = list(db["members"].find({"team": team}, {"_id": 0}))
    summaries = {m.get("id"): m for m in db["member_summaries"].find({}, {"_id": 0})}
    rows = []
    for m in team_members:
        summary = summaries.get(m.get("id"), {})
        delivered_amt = summary.get("deliveredAmt", 0)
        target = m.get("target") or summary.get("target") or 1100
        rows.append({
            "id": m.get("id"),
            "name": m.get("name", ""),
            "role": m.get("role", "Member"),
            "target": target,
            "deliveredAmt": delivered_amt,
            "delivered": summary.get("delivered", 0),
            "progress": round((delivered_amt / target) * 100, 1) if target else 0
        })
    rows.sort(key=lambda x: x.get("deliveredAmt", 0), reverse=True)
    return jsonify({"team": team, "members": rows})

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
    allowed_fields = ["name", "fullName", "role", "team", "target", "email", "phone", "password", "isAdmin"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    db["members"].update_one({"id": emp_id}, {"$set": update_data})
    clear_api_cache()
    audit_log(db, "member_updated", f"Updated member {emp_id}")
    return jsonify({"ok": True})

@app.route("/api/admin/members/add", methods=["POST"])
def admin_add_member():
    data = request.get_json(force=True)
    if not data.get("id") or not data.get("name"): return jsonify({"error": "missing data"}), 400
    db = get_db()
    db["members"].insert_one(data)
    clear_api_cache()
    audit_log(db, "member_added", f"Added member {data.get('id')} - {data.get('name')}")
    return jsonify({"ok": True})

@app.route("/api/admin/members/delete", methods=["POST"])
def admin_delete_member():
    data = request.get_json(force=True)
    emp_id = data.get("id")
    if not emp_id: return jsonify({"error": "missing id"}), 400
    db = get_db()
    db["members"].delete_one({"id": emp_id})
    clear_api_cache()
    audit_log(db, "member_deleted", f"Deleted member {emp_id}")
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
    audit_log(db, "attendance_updated", f"Updated attendance for {emp_id} on {date_str}")
    return jsonify({"ok": True})

@app.route("/api/admin/announcements", methods=["POST"])
def admin_send_announcement():
    data = request.get_json(force=True)
    message = str(data.get("message", "")).strip()
    target = str(data.get("target", "all")).strip() or "all"
    if not message: return jsonify({"error": "message required"}), 400
    db = get_db()
    title = data.get("title", "Announcement")
    recipients = [target]
    if target == "all":
        all_members = list(db["members"].find({}, {"id": 1, "_id": 0}))
        recipients = [m["id"] for m in all_members if m.get("id")] or ["all"]
    else:
        team_members = list(db["members"].find({"team": target}, {"id": 1, "_id": 0}))
        if team_members:
            recipients = [m["id"] for m in team_members if m.get("id")]
    docs = [{
        "emp_id": recipient,
        "text": message,
        "title": title,
        "read": False,
        "timestamp": time.time()
    } for recipient in recipients]
    if docs:
        db["notifications"].insert_many(docs)
    audit_log(db, "announcement_sent", f"Sent announcement to {target}")
    return jsonify({"ok": True})

@app.route("/api/attendance-stats", methods=["GET"])
def get_attendance_stats():
    db = get_db()
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    records = list(db["attendance"].find({"date": today}))
    stats = {}
    for r in records:
        stats[r["emp_id"]] = {
            "status": r.get("status", "Present"),
            "in": r.get("in"),
            "out": r.get("out")
        }
    return jsonify(stats)

@app.route("/api/admin/leave-requests", methods=["GET"])
def admin_get_leave_requests():
    db = get_db()
    status = request.args.get("status", "")
    query = {"status": status} if status else {}
    docs = list(db["leave_requests"].find(query, {"_id": 0}).sort("created_at", -1).limit(100))
    return jsonify(docs)

@app.route("/api/admin/leave-requests/update", methods=["POST"])
def admin_update_leave_request():
    data = request.get_json(force=True)
    key = data.get("key")
    status = data.get("status")
    if not key or status not in ["Approved", "Rejected", "Pending"]:
        return jsonify({"error": "invalid data"}), 400
    db = get_db()
    req = db["leave_requests"].find_one({"key": key}, {"_id": 0})
    if not req: return jsonify({"error": "not found"}), 404
    db["leave_requests"].update_one({"key": key}, {"$set": {"status": status, "reviewed_at": time.time()}})
    db["notifications"].insert_one({
        "emp_id": req.get("emp_id"),
        "text": f"Your leave request ({req.get('from')} to {req.get('to')}) was {status.lower()}.",
        "title": "Leave Request",
        "read": False,
        "timestamp": time.time()
    })
    audit_log(db, f"leave_{status.lower()}", f"{status} leave request for {req.get('emp_id')}")
    return jsonify({"ok": True})

@app.route("/api/admin/attendance-corrections", methods=["GET"])
def admin_get_attendance_corrections():
    db = get_db()
    status = request.args.get("status", "")
    query = {"status": status} if status else {}
    docs = list(db["attendance_corrections"].find(query, {"_id": 0}).sort("created_at", -1).limit(100))
    return jsonify(docs)

@app.route("/api/admin/attendance-corrections/update", methods=["POST"])
def admin_update_attendance_correction():
    data = request.get_json(force=True)
    key = data.get("key")
    status = data.get("status")
    if not key or status not in ["Approved", "Rejected", "Pending"]:
        return jsonify({"error": "invalid data"}), 400
    db = get_db()
    req = db["attendance_corrections"].find_one({"key": key}, {"_id": 0})
    if not req: return jsonify({"error": "not found"}), 404
    db["attendance_corrections"].update_one({"key": key}, {"$set": {"status": status, "reviewed_at": time.time()}})
    if status == "Approved":
        update_data = {k: req.get(k, "") for k in ["in", "out"] if req.get(k)}
        if update_data:
            db["attendance"].update_one(
                {"emp_id": req.get("emp_id"), "date": req.get("date")},
                {"$set": {**update_data, "status": "Present"}},
                upsert=True
            )
    db["notifications"].insert_one({
        "emp_id": req.get("emp_id"),
        "title": "Attendance Correction",
        "text": f"Your attendance correction for {req.get('date')} was {status.lower()}.",
        "read": False,
        "timestamp": time.time()
    })
    audit_log(db, f"attendance_correction_{status.lower()}", f"{status} correction for {req.get('emp_id')} on {req.get('date')}")
    return jsonify({"ok": True})

@app.route("/api/admin/daily-reports", methods=["GET"])
def admin_get_daily_reports():
    db = get_db()
    date_str = request.args.get("date", "")
    query = {"date": date_str} if date_str else {}
    docs = list(db["daily_reports"].find(query, {"_id": 0}).sort("date", -1).limit(120))
    return jsonify(docs)

@app.route("/api/admin/audit-logs", methods=["GET"])
def admin_audit_logs():
    db = get_db()
    docs = list(db["audit_logs"].find({}, {"_id": 0}).sort("timestamp", -1).limit(80))
    return jsonify(docs)

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
            clear_api_cache()
            audit_log(db, "calendar_updated", "Updated working day calendar")
            return jsonify({"ok": True})
        except Exception as e: return jsonify({"error": str(e)}), 500

@app.route("/api/delivered-projects")
def get_delivered_from_db():
    """Load delivered projects from MongoDB Archive, optionally filtered by month."""
    try:
        db = get_db()
        import re
        month_filter = request.args.get("month", "")
        query = {
            "status": "Delivered",
            "service": {"$regex": "seo|smm", "$options": "i"}
        }
        if month_filter:
            query["deliveredDate"] = {"$regex": f"^{month_filter}"}
        projects = list(db["projects_archive"].find(query, {"_id": 0}).sort("date", -1))
        return jsonify(projects)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/sync-delivered")
def sync_delivered():
    """Manual: Force pull from Sheets, Update Archive, then return data."""
    try:
        agent_engine.calculate_summaries() 
        clear_api_cache()
        return get_delivered_from_db()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def background_sync_task():
    """Polls Google Sheets every 10 minutes to keep Database Archive fresh."""
    while True:
        try:
            print("Background Sync: Updating Database from Google Sheets...")
            agent_engine.calculate_summaries()
            clear_api_cache()
            print("Background Sync: Complete.")
        except Exception as e:
            print(f"Background Sync Error: {e}")
        time.sleep(600)

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

@app.route("/finance")
def finance_dashboard():
    return render_template("team-finance.html")

@app.route("/sales-analytics")
def sales_analytics():
    return render_template("sales-analytics.html")

@app.route("/api/finance-stats")
def api_finance_stats():
    try:
        db = get_db()
        members = list(db["members"].find({}, {"_id": 0, "name": 1, "team": 1}))
        name_to_team = {}
        for m in members:
            name = m.get("name")
            team = m.get("team")
            if name and team:
                name_to_team[name.strip().lower()] = team
        
        seo_teams = ["GEO Rankers", "Rank Riser", "Search Apex"]
        smm_teams = ["SMM"]

        delivered = list(db["projects_archive"].find({"status": "Delivered"}))
        delivered.sort(key=lambda x: x.get("deliveredDate") or x.get("date") or "")
        
        monthly_stats = {}
        client_history = set()
        
        for p in delivered:
            month = p.get("month")
            if not month: continue
            if month not in monthly_stats:
                monthly_stats[month] = {
                    "total_sales": 0,
                    "total_deliveries": 0,
                    "platforms": {"Fiverr": 0, "Upwork": 0, "B2B": 0, "PPH": 0},
                    "repeat_sales": 0,
                    "SEO": {"Fiverr": 0, "Upwork": 0, "B2B": 0, "PPH": 0},
                    "SMM": {"Fiverr": 0, "Upwork": 0, "B2B": 0, "PPH": 0}
                }
            
            amt = float(p.get("amtX", 0))
            if amt <= 0: continue
            
            client = str(p.get("client", "")).strip().lower()
            is_repeat = False
            if client:
                if client in client_history:
                    is_repeat = True
                else:
                    client_history.add(client)
            
            assignees = p.get("assign", "")
            assigned_names = [n.strip().lower() for n in str(assignees).split('/')]
            p_team = None
            for n in assigned_names:
                t = name_to_team.get(n)
                if t:
                    if t in seo_teams: p_team = "SEO"
                    elif t in smm_teams: p_team = "SMM"
                    break
            
            if not p_team:
                p_team = "SEO"
                
            profile = str(p.get("profile", "")).lower()
            platform = "B2B"
            if "fiverr" in profile: platform = "Fiverr"
            elif "upwork" in profile: platform = "Upwork"
            elif "pph" in profile: platform = "PPH"
            
            monthly_stats[month]["total_sales"] += amt
            monthly_stats[month]["total_deliveries"] += 1
            monthly_stats[month]["platforms"][platform] += amt
            if is_repeat:
                monthly_stats[month]["repeat_sales"] += amt
                
            monthly_stats[month][p_team][platform] += amt

        sorted_months = sorted(monthly_stats.keys())[-12:]
        
        for i, m in enumerate(sorted_months):
            stats = monthly_stats[m]
            if i == 0:
                stats["focus"] = "🚀 Start of period. Push all channels."
                continue
            
            prev_m = sorted_months[i-1]
            prev_stats = monthly_stats[prev_m]
            
            focus_msg = ""
            if stats["platforms"]["Fiverr"] < prev_stats["platforms"]["Fiverr"] * 0.8:
                focus_msg = "🔴 Fiverr dropped >20%. Optimize gigs!"
            elif stats["platforms"]["B2B"] > prev_stats["platforms"]["B2B"] * 1.2 and prev_stats["platforms"]["B2B"] > 0:
                focus_msg = "🟢 B2B growing fast! Double down on outreach."
            elif stats["repeat_sales"] < prev_stats["repeat_sales"]:
                focus_msg = "⚠️ Repeat clients down. Send follow-ups."
            else:
                focus_msg = "⭐ Stable growth. Maintain quality control."
                
            stats["focus"] = focus_msg
        
        return jsonify({
            "status": "ok",
            "months": sorted_months,
            "data": monthly_stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/status")
def api_status():
    return jsonify({"status": "running", "sheetId": SHEET_ID})

# ── Team Finance ──────────────────────────────────────────────────────────────

_Z12 = [0] * 12

FINANCE_DATA = {
    "months": ["Jul '26","Aug '26","Sep '26","Oct '26","Nov '26","Dec '26",
               "Jan '27","Feb '27","Mar '27","Apr '27","May '27","Jun '27"],
    "star_months": [5, 8, 9],
    "teams": [
        {
            "id": "seo", "name": "Team SEO",
            "subtitle": "Marketplace & B2B Sales", "color": "#10D9A0",
            "profiles": [
                {"sl":1,"name":"Fiverr","type":"Marketplace",
                 "monthly":[32000,32000,33000,35000,36000,38000,40000,40000,40000,42000,43000,45000]},
                {"sl":2,"name":"Upwork","type":"Marketplace","monthly":_Z12},
                {"sl":3,"name":"PPH",   "type":"Marketplace","monthly":_Z12},
                {"sl":4,"name":"B2B",   "type":"B2B Sales",  "monthly":_Z12}
            ],
            "manpower": {
                "total":     [41,41,41,45,45,48,53,53,53,53,55,55],
                "sales":     [12,12,12,12,12,12,12,12,12,12,12,12],
                "operation": [28,28,28,32,32,35,40,40,40,40,42,42],
                "bdt":       [1,1,1,1,1,1,1,1,1,1,1,1],
                "b2b_sales": _Z12,
                "sp_budget": [9600,9600,9900,10500,10800,11400,12000,12000,12000,12600,12900,13500],
                "tool_cost": _Z12
            },
            "kpi": [300,300,300,231,308,308,313,375,375,389,500,556]
        },
        {
            "id": "smm", "name": "Team SMM",
            "subtitle": "Social Media Marketing", "color": "#A855F7",
            "profiles": [
                {"sl":1,"name":"Fiverr","type":"Marketplace",
                 "monthly":[3000,3000,3000,3000,4000,4000,5000,6000,6000,7000,9000,10000]},
                {"sl":2,"name":"Upwork","type":"Marketplace","monthly":_Z12},
                {"sl":3,"name":"PPH",   "type":"Marketplace","monthly":_Z12},
                {"sl":4,"name":"B2B",   "type":"B2B Sales",  "monthly":_Z12}
            ],
            "manpower": {
                "total":     [10,10,10,13,13,13,16,16,16,18,18,18],
                "sales":     [3,3,3,3,3,3,6,6,6,6,6,6],
                "operation": [7,7,7,10,10,10,10,10,10,12,12,12],
                "bdt":       _Z12,
                "b2b_sales": _Z12,
                "sp_budget": [900,900,900,900,1200,1200,1500,1800,1800,2100,2700,3000],
                "tool_cost": _Z12
            },
            "kpi": [703,723,716,731,746,746,722,750,750,778,806,833]
        }
    ]
}

@app.route("/team-finance")
def team_finance():
    return render_template("team-finance.html")

@app.route("/target-tracking")
def target_tracking():
    return render_template("target-tracking.html")

@app.route("/api/finance")
def api_finance():
    return jsonify(FINANCE_DATA)

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
                clear_api_cache()
            except Exception as e:
                print(f"❌ Background scheduler error: {e}")

    # Only start the thread in the main process (avoids duplicates in debug mode)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        t = threading.Thread(target=run_sync_loop, daemon=True)
        t.start()

if __name__ == "__main__":
    start_background_sync()
    app.run(host="0.0.0.0", port=5000, debug=True)
