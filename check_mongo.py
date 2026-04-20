from shared_utils import get_db
import json

def check_db():
    db = get_db()
    print("Checking Collections:")
    for coll in ["dept_summary", "team_summaries", "member_summaries", "members", "config"]:
        count = db[coll].count_documents({})
        print(f" - {coll}: {count} documents")
        
    print("\nDept Summary:")
    dept = db["dept_summary"].find_one({"_id": "current_stats"})
    print(json.dumps(dept, indent=2, default=str))
    
    print("\nTeam Summaries:")
    teams = db["team_summaries"].find_one({"_id": "current_stats"})
    if teams:
        print(json.dumps(teams, indent=2, default=str))
    else:
        print("No team summary found.")

if __name__ == "__main__":
    check_db()
