from shared_utils import get_db
import json

def check_counts():
    db = get_db()
    print("Checking Collections Counts:")
    for coll in ["dept_summary", "team_summaries", "member_summaries", "members", "config"]:
        count = db[coll].count_documents({})
        print(f" - {coll}: {count} documents")

if __name__ == "__main__":
    check_counts()
