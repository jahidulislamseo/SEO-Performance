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
@app.route("/finance")
@app.route("/work-examples")
@app.route("/admin/work-examples")
@app.route("/kpi-reports")
def index():
    return render_template("index.html")

@app.route("/api/sync", methods=["GET", "POST"])
def api_sync():
    """Pull fresh data from Google Sheets → MongoDB, then recalculate summaries.
    Accepts both GET (manual) and POST (from Google Apps Script webhook).
    """
    try:
        import sync_mongo
        sync_mongo.sync()                       # Step 1: fetch from Sheet → save to MongoDB
        agent_engine.calculate_summaries()      # Step 2: recalculate all summaries
        clear_api_cache()
        return jsonify({"status": "ok", "message": "Live sync from Google Sheets complete. Dashboard updated."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/webhook/sheet-sync", methods=["POST", "GET"])
def sheet_webhook():
    """Dedicated webhook endpoint for Google Apps Script onEdit trigger.
    Called automatically whenever the Google Sheet is edited.
    """
    try:
        import sync_mongo
        sync_mongo.sync()
        agent_engine.calculate_summaries()
        clear_api_cache()
        print("🔔 Webhook triggered: Sheet changed → Dashboard synced!")
        return jsonify({"status": "ok", "message": "Sheet webhook sync complete."})
    except Exception as e:
        print(f"❌ Webhook sync error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/admin/cleanup-duplicates", methods=["POST"])
def cleanup_duplicate_members():
    """One-time cleanup: remove duplicate entries in member_summaries, keeping the latest per ID."""
    try:
        db = get_db()
        all_docs = list(db["member_summaries"].find({}, {"_id": 1, "id": 1}))
        
        def clean_id(v):
            s = str(v) if v else ""
            return s[:-2] if s.endswith(".0") else s
        
        seen = {}
        to_delete = []
        for doc in all_docs:
            eid = clean_id(doc.get("id", ""))
            if eid in seen:
                to_delete.append(doc["_id"])  # delete the older duplicate
            else:
                seen[eid] = doc["_id"]
        
        if to_delete:
            result = db["member_summaries"].delete_many({"_id": {"$in": to_delete}})
            deleted = result.deleted_count
        else:
            deleted = 0
        
        clear_api_cache()
        return jsonify({"ok": True, "deleted_duplicates": deleted, "unique_members": len(seen)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Shared helper ─────────────────────────────────────────────────────────────
def _clean_id(raw):
    s = str(raw) if raw is not None else ""
    return s[:-2] if s.endswith(".0") else s


@app.route("/api/data")
def api_data():
    """Main Dashboard: supports ?month=YYYY-MM for historical view."""
    try:
        req_month = request.args.get("month", "").strip()
        cur_month = datetime.now(timezone(timedelta(hours=6))).strftime("%Y-%m")

        if req_month and req_month != cur_month:
            return jsonify(_build_month_payload(req_month))

        cache_key = f"api_data_{cur_month}"
        return cached_json(cache_key, API_CACHE_TTL, _build_current_payload)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _build_current_payload():
    """Return current-month pre-calculated summaries from MongoDB."""
    db = get_db()
    dept_sum_doc = db["dept_summary"].find_one({"_id": "current_stats"})
    team_sum_doc = db["team_summaries"].find_one({"_id": "current_stats"})
    member_docs = list(db["member_summaries"].find({}, {"_id": 0}))
    
    # Fetch ALL project remarks to join in real-time
    all_remarks = {r["order"]: r.get("logs", []) for r in db["project_remarks"].find({}, {"order": 1, "logs": 1})}
    all_worksheets = {r["order"]: r.get("url", "") for r in db["project_worksheets"].find({}, {"order": 1, "url": 1})}

    seen_ids = {}
    for m in member_docs:
        # Join remarks and worksheets to each project in real-time
        if "projects" in m:
            for p in m["projects"]:
                order_num = p.get("order")
                p["userRemarks"] = all_remarks.get(order_num, [])
                p["userWorksheet"] = all_worksheets.get(order_num, "")
        
        seen_ids[_clean_id(m.get("id", ""))] = m
    member_docs = list(seen_ids.values())

    ADMIN_IDS = {"17149", "17137", "17248", "17238"}
    members_profiles = {_clean_id(m["id"]): m for m in db["members"].find({}, {"_id": 0}) if m.get("id")}

    for m in member_docs:
        m["id"] = _clean_id(m.get("id", ""))
        prof = members_profiles.get(m["id"])
        if prof:
            if "target" in prof: m["target"] = prof["target"]
            if "name" in prof: m["name"] = prof["name"]
            if "role" in prof: m["role"] = prof["role"]
            if "team" in prof: m["team"] = prof["team"]
            if "avatar" in prof: m["avatar"] = prof["avatar"]
        m["isAdmin"] = m["id"] in ADMIN_IDS or "Manager" in m.get("role", "") or "Leader" in m.get("role", "")

    if team_sum_doc and "teams" in team_sum_doc:
        for team_name, team_data in team_sum_doc["teams"].items():
            configured_target = team_data.get("target", 0)
            team_target = 0
            for tm in team_data.get("members", []):
                prof = members_profiles.get(tm.get("id"))
                if prof and "target" in prof: tm["target"] = prof["target"]
                if prof and "name" in prof: tm["name"] = prof["name"]
                if prof and "avatar" in prof: tm["avatar"] = prof["avatar"]
                team_target += tm.get("target", 1100)
            final_target = configured_target if configured_target > 0 else team_target
            team_data["target"] = final_target
            team_data["progress"] = min(100, round((team_data.get("deliveredAmt", 0) / final_target * 100))) if final_target > 0 else 0

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


def _build_month_payload(month_str):
    """Calculate member/team stats from projects_archive for any historical month."""
    import re as _re
    db = get_db()
    from shared_utils import DEPT_TARGET, MEM_TARGET, TEAM_TARGETS, MANAGEMENT

    raw_projects = list(db["projects_archive"].find({"month": month_str}, {"_id": 0}))
    # Fetch ALL project remarks to join in real-time
    all_remarks = {r["order"]: r.get("logs", []) for r in db["project_remarks"].find({}, {"order": 1, "logs": 1})}
    
    # Filter only SEO and SMM projects
    projects = []
    for p in raw_projects:
        if "SEO" in str(p.get("service", "")).upper() or "SMM" in str(p.get("service", "")).upper():
            order_num = p.get("order")
            p["userRemarks"] = all_remarks.get(order_num, [])
            projects.append(p)
    
    members_list = list(db["members"].find({"isOfficial": True}, {"_id": 0}))
    ADMIN_IDS = {"17149", "17137", "17248", "17238"}

    platform_stats = {"Fiverr": 0.0, "Upwork": 0.0, "B2B": 0.0, "PPH": 0.0}
    total_delivered_amt = 0.0
    total_wip_amt = 0.0
    total_cancelled_amt = 0.0
    delivered_count = wip_count = cancelled_count = 0

    for p in projects:
        status = str(p.get("status", "")).strip()
        amt = float(p.get("amtX", 0) or 0)
        prof = str(p.get("profile", "")).lower()
        if status == "Delivered":
            total_delivered_amt += amt
            delivered_count += 1
            if "fiverr" in prof: platform_stats["Fiverr"] += amt
            elif "upwork" in prof: platform_stats["Upwork"] += amt
            elif "pph" in prof: platform_stats["PPH"] += amt
            else: platform_stats["B2B"] += amt
        elif status in ("WIP", "Revision"):
            total_wip_amt += amt
            wip_count += 1
        elif status == "Cancelled":
            total_cancelled_amt += amt
            cancelled_count += 1

    platform_stats = {k: round(v, 2) for k, v in platform_stats.items()}

    member_summaries = []
    for m in members_list:
        name = m["name"]
        emp_id = _clean_id(m.get("id", ""))
        m_projects = []
        for p in projects:
            assign_str = str(p.get("assign", ""))
            parts = [x.strip().lower() for x in _re.split(r"[/,]", assign_str) if x.strip()]
            num_assigned = max(len(parts), 1)
            if name.strip().lower() in parts:
                share = round(float(p.get("amtX", 0) or 0) / num_assigned, 2)
                m_projects.append({**p, "share": share})

        delivered_projects = [p for p in m_projects if p.get("status") == "Delivered"]
        wip_projects = [p for p in m_projects if p.get("status") in ("WIP", "Revision")]
        team_name = m.get("team", "GEO Rankers")
        if team_name == "SMM": team_name = "Dark Rankers"
        delivered_amt = round(sum(p["share"] for p in delivered_projects), 2)
        wip_amt = round(sum(p["share"] for p in wip_projects), 2)
        target = m.get("target", MEM_TARGET())

        s = {
            "name": name, "fullName": m.get("fullName", name), "team": team_name, "id": emp_id,
            "role": m.get("role", "Member"), "email": m.get("email", ""), "phone": m.get("phone", ""),
            "target": target, "total": len(m_projects),
            "delivered": len(delivered_projects),
            "wip": len([p for p in m_projects if p.get("status") == "WIP"]),
            "revision": len([p for p in m_projects if p.get("status") == "Revision"]),
            "cancelled": len([p for p in m_projects if p.get("status") == "Cancelled"]),
            "deliveredAmt": delivered_amt, "wipAmt": wip_amt,
            "lateCount": 0, "absentCount": 0, "inTimeCount": 0, "presentCount": 0,
            "projects": [{"order": p.get("order"), "status": p.get("status"), "amtX": p.get("amtX"),
                          "share": p.get("share"), "client": p.get("client"), "date": p.get("date"),
                          "assign": p.get("assign"), "service": p.get("service"),
                          "deliveredDate": p.get("deliveredDate"), "profile": p.get("profile")} for p in m_projects],
            "isAdmin": emp_id in ADMIN_IDS or "Manager" in m.get("role", "") or "Leader" in m.get("role", "")
        }
        s["performanceScore"] = round((delivered_amt / target) * 50, 1) if target else 0
        s["remaining"] = round(delivered_amt - target, 2)
        s["progress"] = round((delivered_amt / target) * 100, 1) if target else 0
        member_summaries.append(s)

    targets = TEAM_TARGETS()
    mgmt = MANAGEMENT()
    TEAM_TAG_MAP = {
        "GEO Rankers": "Geo_Rankers", "Rank Riser": "Rank_Riser",
        "Search Apex": "Search_Apex", "Dark Rankers": "Dark_Rankers"
    }
    team_data = {}
    for team in targets.keys():
        tag = TEAM_TAG_MAP.get(team, team.replace(" ", "_"))
        t_projects = [p for p in projects if str(p.get("team", "")).strip().lower() == tag.lower()]
        t_delivered = [p for p in t_projects if p.get("status") == "Delivered"]
        t_wip = [p for p in t_projects if p.get("status") in ("WIP", "Revision")]
        t_delivered_amt = round(sum(float(p.get("amtX", 0) or 0) for p in t_delivered), 2)
        t_wip_amt = round(sum(float(p.get("amtX", 0) or 0) for p in t_wip), 2)
        team_target = targets.get(team, 0)
        team_data[team] = {
            "name": team,
            "leader": mgmt.get("leaders", {}).get(team, {}).get("name", "N/A"),
            "amt": t_delivered_amt, "deliveredAmt": t_delivered_amt, "wipAmt": t_wip_amt,
            "projects": len(t_projects), "delivered": len(t_delivered),
            "wip": len([p for p in t_projects if p.get("status") == "WIP"]),
            "revision": len([p for p in t_projects if p.get("status") == "Revision"]),
            "cancelled": len([p for p in t_projects if p.get("status") == "Cancelled"]),
            "target": team_target,
            "remaining": round(team_target - t_delivered_amt, 2),
            "progress": round((t_delivered_amt / team_target) * 100, 1) if team_target else 0
        }

    dept_doc = {
        "target": DEPT_TARGET(), "achieved": round(total_delivered_amt, 2),
        "wipAmt": round(total_wip_amt, 2), "cancelledAmt": round(total_cancelled_amt, 2),
        "uniqueProjects": len(set(p.get("order", "") for p in projects)),
        "deliveredRows": delivered_count, "wipRows": wip_count, "cancelledRows": cancelled_count,
        "seoSmmRows": len(projects), "platformStats": platform_stats,
        "presentToday": 0, "lateToday": 0, "absentToday": 0, "name": "GEO Rankers",
        "bestPerformer": sorted(member_summaries, key=lambda x: x["deliveredAmt"], reverse=True)[0] if member_summaries else None,
        "bestTeam": sorted(team_data.values(), key=lambda x: x["deliveredAmt"], reverse=True)[0] if team_data else None,
    }
    summary = {
        "dept": dept_doc, "teams": team_data,
        "totalAchieved": round(total_delivered_amt, 2),
        "uniqueOrders": dept_doc["uniqueProjects"], "totaleOrders": dept_doc["uniqueProjects"],
        "audit": {"seoSmmRows": len(projects), "matchedRows": len(projects), "unmatchedRows": 0,
                  "uniqueOrders": dept_doc["uniqueProjects"], "unmatchedItems": []}
    }
    return {
        "status": "ok", "data": member_summaries, "summary": summary,
        "audit": summary["audit"], "projectCount": dept_doc["uniqueProjects"],
        "memberCount": len(member_summaries), "lastSync": time.time(), "month": month_str
    }


@app.route("/api/data-months")
def api_data_months():
    """Return list of available months in projects_archive."""
    try:
        import re
        db = get_db()
        months = db["projects_archive"].distinct("month")
        # Only keep strictly YYYY-MM strings
        valid = sorted([m for m in months if m and isinstance(m, str) and re.match(r"^\d{4}-\d{2}$", m)], reverse=True)
        return jsonify(valid)
    except Exception as e:
        return jsonify([])

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
        # Robust profiles map
        profiles_by_id = {}
        for prof in db["members"].find():
            pid = prof.get("id")
            if pid:
                profiles_by_id[_cid(pid)] = prof

        for m in member_docs:
            m_id = _cid(m.get("id", ""))
            m["id"] = m_id
            prof = profiles_by_id.get(m_id)
            if prof:
                if "target" in prof: m["target"] = prof["target"]
                if "name" in prof: m["name"] = prof["name"]
                if "role" in prof: m["role"] = prof["role"]
                if "team" in prof: m["team"] = prof["team"]
                if "avatar" in prof: m["avatar"] = prof["avatar"]
        
        # Recalculate team targets based on updated members
        if team_sum_doc and "teams" in team_sum_doc:
            for team_name, team_data in team_sum_doc["teams"].items():
                team_target = 0
                for tm in team_data.get("members", []):
                    tm_id = _cid(tm.get("id"))
                    prof = profiles_by_id.get(tm_id)
                    if prof:
                        if "target" in prof: tm["target"] = prof["target"]
                        if "name" in prof: tm["name"] = prof["name"]
                        if "avatar" in prof: tm["avatar"] = prof["avatar"]
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
                "1": "Hi! Your project has been successfully delivered.\n\nOrder: {order}\nService: {service}\n\nPlease review and let us know your feedback! (Thank You)",
                "2": "Hi! Checking in again regarding your delivery (Order: {order}).\n\nDid everything meet your expectations? Let us know if you need anything!",
                "3": "Hi! Checking in (3rd follow-up) for Order: {order}.\n\nWe want to ensure you're satisfied. Please let us know if there's anything to review!",
                "4": "Hi! Just following up (4th time) on Order: {order}.\n\nCould you please take a moment to confirm everything is in order?",
                "5": "Hi! Final follow-up for Order: {order}.\n\nPlease let us know if you have any last concerns. Thank you for your trust! (Thank You)"
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
    """Return late/absent count + today's in/out time for all members."""
    try:
        db = get_db()
        tz_bd = timezone(timedelta(hours=6))
        today = datetime.now(tz_bd).strftime('%Y-%m-%d')
        docs = list(db["attendance"].find({}, {"_id": 0, "emp_id": 1, "status": 1, "date": 1, "in": 1, "out": 1}))
        stats = {}
        for d in docs:
            raw = str(d.get("emp_id", ""))
            eid = raw[:-2] if raw.endswith(".0") else raw
            if eid not in stats:
                stats[eid] = {"late": 0, "absent": 0, "today_in": None, "today_out": None, "today_status": None}
            s = d.get("status", "")
            if s == "Late":   stats[eid]["late"]   += 1
            if s == "Absent": stats[eid]["absent"] += 1
            if d.get("date") == today:
                if d.get("in"):  stats[eid]["today_in"]     = d["in"]
                if d.get("out"): stats[eid]["today_out"]    = d["out"]
                if s:            stats[eid]["today_status"]  = s
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

@app.route("/api/attendance/status", methods=["GET"])
def attendance_status():
    """Check if the user is already checked in today."""
    emp_id = request.args.get("memberId")
    if not emp_id: return jsonify({"error": "memberId required"}), 400
    try:
        db = get_db()
        tz_bd = timezone(timedelta(hours=6))
        today_str = datetime.now(tz_bd).strftime('%Y-%m-%d')
        existing = db["attendance"].find_one({"emp_id": emp_id, "date": today_str})
        
        has_checked_in = bool(existing and existing.get("in"))
        is_checked_out = bool(existing and existing.get("out"))
        
        return jsonify({
            "checkedIn": has_checked_in and not is_checked_out,
            "hasCheckedInToday": has_checked_in,
            "checkedOut": is_checked_out
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/attendance/checkin", methods=["POST"])
def attendance_checkin():
    try:
        data = request.get_json(force=True)
        print(f"[ATTENDANCE] Checkin request data: {data}")
        emp_id = data.get("memberId") or data.get("emp_id")
        if not emp_id: 
            print("[ATTENDANCE] Error: memberId missing")
            return jsonify({"error": "memberId required"}), 400
        
        db = get_db()
        tz_bd = timezone(timedelta(hours=6))
        now = datetime.now(tz_bd)
        today_str = now.strftime('%Y-%m-%d')
        time_str = now.strftime('%I:%M %p')
        ip = request.remote_addr
        
        print(f"[ATTENDANCE] Processing checkin for {emp_id} on {today_str}")
        existing = db["attendance"].find_one({"emp_id": emp_id, "date": today_str})
        
        user_agent = request.headers.get("User-Agent", "").lower()
        device = "Mobile" if "mobi" in user_agent or "android" in user_agent or "iphone" in user_agent else "PC"
        
        if existing and existing.get("in"):
            # User is checking in again (e.g. back from a break)
            # Remove the out time and duration so they are 'Active' again
            # Do NOT overwrite their first 'in' time
            db["attendance"].update_one(
                {"_id": existing["_id"]},
                {"$unset": {"out": "", "duration": ""},
                 "$set": {"device_in": device, "ip_in": ip}}
            )
            print(f"[ATTENDANCE] Success: {emp_id} checked back in")
            return jsonify({"ok": True, "message": "Welcome back", "status": existing.get("status")})
            
        from shared_utils import TEAM_SHIFTS
        member = db["members"].find_one({"id": emp_id})
        team = member.get("team", "GEO Rankers") if member else "GEO Rankers"
        
        team_shifts = TEAM_SHIFTS()
        shift_time_str = team_shifts.get(team, "08:00")
        
        try:
            shift_hour, shift_minute = map(int, shift_time_str.split(":"))
        except:
            shift_hour, shift_minute = 8, 0
            
        shift_time = now.replace(hour=shift_hour, minute=shift_minute, second=0, microsecond=0)
        cutoff = shift_time + timedelta(minutes=15)
        
        status = "Late" if now > cutoff else "Present"
        
        update_doc = {
            "in": time_str,
            "ip_in": ip,
            "device_in": device,
            "status": status,
            "date": today_str,
            "emp_id": emp_id
        }
        db["attendance"].update_one({"emp_id": emp_id, "date": today_str}, {"$set": update_doc}, upsert=True)
        print(f"[ATTENDANCE] Success: {emp_id} checked in as {status}")
        return jsonify({"ok": True, "time": time_str, "status": status})
    except Exception as e:
        print(f"[ATTENDANCE] Exception: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/attendance/checkout", methods=["POST"])
def attendance_checkout():
    try:
        data = request.get_json(force=True)
        print(f"[ATTENDANCE] Checkout request data: {data}")
        emp_id = data.get("memberId") or data.get("emp_id")
        if not emp_id: 
            print("[ATTENDANCE] Error: memberId missing")
            return jsonify({"error": "memberId required"}), 400
        
        db = get_db()
        tz_bd = timezone(timedelta(hours=6))
        now = datetime.now(tz_bd)
        today_str = now.strftime('%Y-%m-%d')
        time_str = now.strftime('%I:%M %p')
        ip = request.remote_addr
        
        user_agent = request.headers.get("User-Agent", "").lower()
        device = "Mobile" if "mobi" in user_agent or "android" in user_agent or "iphone" in user_agent else "PC"
        
        print(f"[ATTENDANCE] Processing checkout for {emp_id} on {today_str}")
        existing = db["attendance"].find_one({"emp_id": emp_id, "date": today_str})
        if not existing or not existing.get("in"):
            print(f"[ATTENDANCE] Error: {emp_id} must check in first")
            return jsonify({"error": "Must check in first"}), 400
            
        in_time_str = existing["in"]
        in_time = datetime.strptime(in_time_str, '%I:%M %p').time()
        in_dt = now.replace(hour=in_time.hour, minute=in_time.minute, second=0, microsecond=0)
        
        # If check out time is somehow before check in time (e.g. checked in at 11:50 PM, checked out at 12:10 AM next day)
        # This simple logic assumes same day. If `now` is less than `in_dt`, it might be an issue, but we'll stick to same-day logic.
        if now < in_dt:
            now += timedelta(days=1)
            
        duration = now - in_dt
        hours = duration.seconds // 3600
        minutes = (duration.seconds % 3600) // 60
        duration_str = f"{hours}h {minutes}m"
        
        update_doc = {
            "out": time_str,
            "ip_out": ip,
            "device_out": device,
            "duration": duration_str
        }
        db["attendance"].update_one({"emp_id": emp_id, "date": today_str}, {"$set": update_doc})
        print(f"[ATTENDANCE] Success: {emp_id} checked out. Duration: {duration_str}")
        return jsonify({"ok": True, "time": time_str, "duration": duration_str})
    except Exception as e:
        print(f"[ATTENDANCE] Exception: {str(e)}")
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

@app.route("/api/user/profile", methods=["GET"])
def api_user_profile():
    try:
        emp_id = request.args.get("id")
        if not emp_id: return jsonify({"error": "missing id"}), 400
        
        db = get_db()
        member = db["members"].find_one({"id": {"$in": [emp_id, f"{emp_id}.0"]}})
        if not member: return jsonify({"status": "error", "message": "User not found"}), 404
        
        emp_id = member["id"]
        sum_doc = db["member_summaries"].find_one({"id": emp_id}, {"_id": 0})
        if not sum_doc: sum_doc = {**member, "deliveredAmt": 0, "wipAmt": 0, "projects": [], "progress": 0}

        admin_ids = ["17149", "17137", "17248", "17238"]
        current_id_str = str(member.get("id")).split('.')[0]
        is_admin = "Manager" in member.get("role", "") or "Leader" in member.get("role", "") or member.get("isAdmin", False) or current_id_str in admin_ids
        tot_days, elap_days = get_month_working_stats(db)

        # Join remarks and worksheets to projects in real-time
        all_remarks = {r["order"]: r.get("logs", []) for r in db["project_remarks"].find({}, {"order": 1, "logs": 1})}
        all_worksheets = {r["order"]: r.get("url", "") for r in db["project_worksheets"].find({}, {"order": 1, "url": 1})}
        projects = sum_doc.get("projects", [])
        for p in projects:
            order_num = p.get("order")
            p["userRemarks"] = all_remarks.get(order_num, [])
            p["userWorksheet"] = all_worksheets.get(order_num, "")

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
                "wipAmt": sum_doc.get("wipAmt", 0), "present": sum_doc.get("delivered", 0)
            },
            "projects": projects,
            "performance": [
                {"label": "Target Progress", "value": sum_doc.get("progress", 0), "target": 100, "unit": "%", "color": "#0f766e"}
            ]
        }
        return jsonify({"status": "ok", "user": res})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/profile/update", methods=["POST"])
def update_user_profile():
    data = request.get_json(force=True)
    emp_id = data.get("id")
    if not emp_id: return jsonify({"error": "missing id"}), 400
    db = get_db()
    allowed_fields = ["phone", "email", "fullName", "password", "avatar"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    if update_data:
        old_doc = db["members"].find_one({"id": emp_id})
        old_name = old_doc.get("name") if old_doc else None
        new_name = update_data.get("fullName") or update_data.get("name")
        
        db["members"].update_one({"id": emp_id}, {"$set": update_data})
        db["member_summaries"].update_one({"id": emp_id}, {"$set": update_data})
        
        # If name changed, update it everywhere it appears as a string
        if new_name and old_name and new_name != old_name:
            # Update projects (active)
            db["projects"].update_many(
                {"assign": {"$regex": old_name, "$options": "i"}},
                [{"$set": {"assign": {"$replaceAll": {"input": "$assign", "find": old_name, "replacement": new_name}}}}]
            )
            # Update projects archive
            db["projects_archive"].update_many(
                {"assign": {"$regex": old_name, "$options": "i"}},
                [{"$set": {"assign": {"$replaceAll": {"input": "$assign", "find": old_name, "replacement": new_name}}}}]
            )
            # Update team leaders
            doc = db["team_summaries"].find_one({"_id": "current_stats"})
            if doc and "teams" in doc:
                changed = False
                for t in doc["teams"].values():
                    if t.get("leader") == old_name:
                        t["leader"] = new_name
                        changed = True
                if changed:
                    db["team_summaries"].replace_one({"_id": "current_stats"}, doc)

        clear_api_cache()
        return jsonify({"ok": True})
    return jsonify({"error": "no valid fields to update"}), 400

@app.route("/api/admin/members", methods=["GET"])
def admin_get_members():
    db = get_db()
    # Filter to show only official members as requested
    members = list(db["members"].find({"isOfficial": True}, {"_id": 0}))
    return jsonify(members)

@app.route("/api/admin/members/update", methods=["POST"])
def admin_update_member():
    data = request.get_json(force=True)
    emp_id = data.get("id")
    if not emp_id: return jsonify({"error": "missing id"}), 400
    db = get_db()
    # Allow updating more fields in admin mode
    allowed_fields = ["name", "fullName", "role", "team", "target", "email", "phone", "password", "isAdmin", "offDay", "avatar", "isOfficial"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    old_doc = db["members"].find_one({"id": emp_id})
    old_name = old_doc.get("name") if old_doc else None
    new_name = update_data.get("fullName") or update_data.get("name")

    db["members"].update_one({"id": emp_id}, {"$set": update_data})
    db["member_summaries"].update_one({"id": emp_id}, {"$set": update_data})
    
    if new_name and old_name and new_name != old_name:
        db["projects"].update_many(
            {"assign": {"$regex": old_name, "$options": "i"}},
            [{"$set": {"assign": {"$replaceAll": {"input": "$assign", "find": old_name, "replacement": new_name}}}}]
        )
        db["projects_archive"].update_many(
            {"assign": {"$regex": old_name, "$options": "i"}},
            [{"$set": {"assign": {"$replaceAll": {"input": "$assign", "find": old_name, "replacement": new_name}}}}]
        )
    
    clear_api_cache()
    audit_log(db, "member_updated", f"Updated member {emp_id}")
    return jsonify({"ok": True})

@app.route("/api/admin/members/add", methods=["POST"])
def admin_add_member():
    data = request.get_json(force=True)
    if not data.get("id") or not data.get("name"): return jsonify({"error": "missing data"}), 400
    db = get_db()
    # Set isOfficial to True for manually added members
    data["isOfficial"] = True
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

@app.route("/api/admin/config", methods=["GET"])
def get_admin_config():
    try:
        from shared_utils import get_config
        return jsonify(get_config())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/config", methods=["POST"])
def update_admin_config():
    try:
        db = get_db()
        from shared_utils import get_config
        data = request.json
        if not data: return jsonify({"error": "No data"}), 400
        
        # update config
        existing_config = get_config()
        update_doc = {
            "dept_target": float(data.get("dept_target", existing_config.get("dept_target", 36000))),
            "team_targets": data.get("team_targets", existing_config.get("team_targets", {})),
            "updated_at": time.time()
        }
        
        db["config"].update_one({"_id": "app_settings"}, {"$set": update_doc}, upsert=True)
        
        # Invalidate cache
        from shared_utils import _CONFIG_CACHE
        _CONFIG_CACHE["last_updated"] = 0
        
        return jsonify({"ok": True, "message": "Targets updated successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
    
    docs = []
    if target == "all":
        # Create a global announcement for the public dashboard
        docs.append({
            "emp_id": "all",
            "text": message,
            "title": title,
            "read": False,
            "timestamp": time.time(),
            "target": "all"
        })
        
        # Also create for individual members so it shows in their private notification center
        all_members = list(db["members"].find({"isOfficial": True}, {"id": 1, "_id": 0}))
        for m in all_members:
            if m.get("id"):
                docs.append({
                    "emp_id": m["id"],
                    "text": message,
                    "title": title,
                    "read": False,
                    "timestamp": time.time(),
                    "target": "all"
                })
    else:
        # Team specific
        team_members = list(db["members"].find({"team": target}, {"id": 1, "_id": 0}))
        for m in team_members:
            if m.get("id"):
                docs.append({
                    "emp_id": m["id"],
                    "text": message,
                    "title": title,
                    "read": False,
                    "timestamp": time.time(),
                    "target": target
                })
                
    if docs:
        db["notifications"].insert_many(docs)
    
    audit_log(db, "announcement_sent", f"Sent announcement to {target}: {title}")
    return jsonify({"ok": True})

@app.route("/api/admin/announcements/history", methods=["GET"])
def get_announcement_history():
    """Retrieve history of sent announcements."""
    db = get_db()
    # We group by timestamp/title to show unique announcements sent (not one for each recipient)
    pipeline = [
        {"$match": {"target": {"$exists": True}}},
        {"$group": {
            "_id": {"timestamp": "$timestamp", "title": "$title", "text": "$text", "target": "$target"},
            "timestamp": {"$first": "$timestamp"},
            "title": {"$first": "$title"},
            "text": {"$first": "$text"},
            "target": {"$first": "$target"}
        }},
        {"$sort": {"timestamp": -1}},
        {"$limit": 50}
    ]
    history = list(db["notifications"].aggregate(pipeline))
    return jsonify(history)

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

@app.route("/api/admin/shifts", methods=["GET", "POST"])
def admin_shifts():
    """Manage team shift timings."""
    db = get_db()
    if request.method == "GET":
        try:
            config = db["config"].find_one({"_id": "app_settings"})
            shifts = config.get("team_shifts", {}) if config else {}
            if not shifts:
                from shared_utils import TEAM_SHIFTS
                shifts = TEAM_SHIFTS()
            return jsonify(shifts)
        except Exception as e: return jsonify({"error": str(e)}), 500
    
    if request.method == "POST":
        try:
            data = request.get_json(force=True)
            db["config"].update_one(
                {"_id": "app_settings"},
                {"$set": {"team_shifts": data}},
                upsert=True
            )
            # Clear cache to force reload of TEAM_SHIFTS
            from shared_utils import _CONFIG_CACHE
            _CONFIG_CACHE["data"] = None
            _CONFIG_CACHE["last_updated"] = 0
            
            audit_log(db, "shifts_updated", "Updated team shift timings")
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
            query["$or"] = [
                {"deliveredDate": {"$regex": f"^{month_filter}"}},
                {"month": month_filter}
            ]
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

@app.route("/api/admin/all-projects")
def admin_all_projects():
    """Load ALL projects from MongoDB Archive with advanced filtering."""
    try:
        db = get_db()
        month_filter = request.args.get("month", "")
        search_q = request.args.get("q", "").strip().lower()
        
        query = {}
        conditions = []

        if month_filter:
            conditions.append({
                "$or": [
                    {"month": month_filter},
                    {"deliveredDate": {"$regex": f"^{month_filter}"}}
                ]
            })
            
        if search_q:
            conditions.append({
                "$or": [
                    {"order": {"$regex": search_q, "$options": "i"}},
                    {"client": {"$regex": search_q, "$options": "i"}},
                    {"assign": {"$regex": search_q, "$options": "i"}},
                    {"service": {"$regex": search_q, "$options": "i"}},
                    {"status": {"$regex": search_q, "$options": "i"}}
                ]
            })
            
        if conditions:
            query["$and"] = conditions
            
        projects = list(db["projects_archive"].find(query, {"_id": 0}).sort("date", -1).limit(1000))
        
        # Join remarks in real-time
        all_remarks = {r["order"]: r.get("logs", []) for r in db["project_remarks"].find({}, {"order": 1, "logs": 1})}
        for p in projects:
            p["userRemarks"] = all_remarks.get(p.get("order"), [])
            
        return jsonify(projects)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/project-remark", methods=["POST"])
def update_project_remark():
    """Allows an employee to append a daily remark for a project in a separate collection for safety."""
    try:
        db = get_db()
        data = request.json
        order_num = data.get("order")
        remark_text = data.get("remark", "").strip()
        
        if not order_num or not remark_text:
            return jsonify({"error": "order number and remark required"}), 400
            
        import datetime
        now = datetime.datetime.now()
        date_str = now.strftime("%d %b %Y")
        
        new_remark = {
            "date": date_str,
            "text": remark_text,
            "timestamp": now.timestamp()
        }
        
        # Save to a dedicated remarks collection
        db["project_remarks"].update_one(
            {"order": order_num},
            {"$push": {"logs": {"$each": [new_remark], "$position": 0}}},
            upsert=True
        )
        
        clear_api_cache()
        return jsonify({"status": "ok", "message": "Remark added", "remark": new_remark})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/project-worksheet", methods=["POST"])
def update_project_worksheet():
    """Allows an employee to save or update a custom worksheet URL for a project."""
    try:
        db = get_db()
        data = request.json
        order_num = data.get("order")
        url = data.get("url", "").strip()

        if not order_num:
            return jsonify({"error": "order number required"}), 400

        db["project_worksheets"].update_one(
            {"order": order_num},
            {"$set": {"url": url}},
            upsert=True
        )

        clear_api_cache()
        return jsonify({"status": "ok", "url": url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/work-history")
def get_user_work_history():
    """Load lifetime project history for a specific member from the archive."""
    try:
        db = get_db()
        member_id = request.args.get("memberId", "")
        if not member_id:
            return jsonify({"error": "memberId required"}), 400
            
        # Get member name for name-based search in 'assign' field
        member = db["members"].find_one({"id": member_id})
        if not member:
            return jsonify({"error": "member not found"}), 404
            
        name = member.get("name", "")
        
        # Search for projects where this member is mentioned in 'assign'
        query = {
            "assign": {"$regex": name, "$options": "i"}
        }
        
        projects = list(db["projects_archive"].find(query, {"_id": 0}).sort("date", -1))
        return jsonify(projects)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
                stats["focus"] = "[START] Start of period. Push all channels."
                continue
            
            prev_m = sorted_months[i-1]
            prev_stats = monthly_stats[prev_m]
            
            focus_msg = ""
            if stats["platforms"]["Fiverr"] < prev_stats["platforms"]["Fiverr"] * 0.8:
                focus_msg = "[ALERT] Fiverr dropped >20%. Optimize gigs!"
            elif stats["platforms"]["B2B"] > prev_stats["platforms"]["B2B"] * 1.2 and prev_stats["platforms"]["B2B"] > 0:
                focus_msg = "[GOOD] B2B growing fast! Double down on outreach."
            elif stats["repeat_sales"] < prev_stats["repeat_sales"]:
                focus_msg = "[WARNING] Repeat clients down. Send follow-ups."
            else:
                focus_msg = "[STABLE] Stable growth. Maintain quality control."
                
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

@app.route("/api/work-examples", methods=["GET", "POST"])
def api_work_examples():
    db = get_db()
    if request.method == "POST":
        data = request.json
        if not data or "categories" not in data:
            return jsonify({"error": "Invalid data"}), 400
        
        # We store the entire structure in one document for simplicity, 
        # or separate documents. One document with id 'portfolio' is easier.
        db["work_examples"].update_one(
            {"_id": "portfolio"},
            {"$set": {"categories": data["categories"], "updated_at": time.time()}},
            upsert=True
        )
        return jsonify({"message": "Successfully updated work examples"})

    # GET
    doc = db["work_examples"].find_one({"_id": "portfolio"})
    if doc:
        return jsonify(doc["categories"])
    
    # Return default empty list if nothing found
    return jsonify([])

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
            # Wait 5 minutes before running next scheduled sync
            # Sleep first to avoid running immediately on boot since we rely on DB mostly
            time.sleep(300) 
            try:
                print("[SYNC] Running automated background sync (5-min interval)...")
                sync_mongo.sync()
                agent_engine.calculate_summaries()
                clear_api_cache()
            except Exception as e:
                print(f"[ERROR] Background scheduler error: {e}")

    # Only start the thread in the main process (avoids duplicates in debug mode)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        print("[SYNC] Background sync starting...")
        t = threading.Thread(target=run_sync_loop, daemon=True)
        t.start()

if __name__ == "__main__":
    start_background_sync()
    app.run(host="0.0.0.0", port=5000, debug=True)
