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

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/delivery-tracker")
def delivery_tracker():
    return render_template("delivery-tracker.html")

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
    """Main Dashboard: Instant load from MongoDB summaries only."""
    try:
        db = get_db()
        dept_sum_doc = db["dept_summary"].find_one({"_id": "current_stats"})
        team_sum_doc = db["team_summaries"].find_one({"_id": "current_stats"})
        member_docs   = list(db["member_summaries"].find({}, {"_id": 0}))
        
        if not dept_sum_doc:
            return jsonify({"status": "syncing", "message": "Database initializing..."})

        summary = {
            "dept": dept_sum_doc or {},
            "teams": team_sum_doc.get("teams", {}) if team_sum_doc else {},
            "totalAchieved": dept_sum_doc.get("achieved", 0),
            "totalWip": dept_sum_doc.get("wipAmt", 0),
            "uniqueOrders": dept_sum_doc.get("uniqueProjects", 0),
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

@app.route("/api/status")
def api_status():
    return jsonify({"status": "running", "sheetId": SHEET_ID})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
