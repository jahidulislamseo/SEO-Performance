import sys
import os
sys.path.append(os.getcwd())
from shared_utils import get_db, normalize_name, normalize_assignee_token, NAME_ALIASES
import pandas as pd
import re

def audit_unmatched():
    db = get_db()
    # 1. Get Members
    members = list(db["members"].find({}, {"_id": 0}))
    member_lookup = {m["name"].strip().lower(): m["name"] for m in members}
    aliases = NAME_ALIASES()
    for alias, official in aliases.items():
        member_lookup[alias.lower()] = official

    # 2. Get Raw Data from Archive (for current month)
    # Today is April 2026
    current_month = "2026-04"
    projects = list(db["projects_archive"].find({"month": current_month}))
    
    unmatched = []
    for p in projects:
        assign_text = str(p.get("assign", "")).strip()
        if not assign_text or assign_text.lower() in ["n/a", "none", ""]:
            unmatched.append({"order": p["order"], "assign": assign_text, "reason": "Empty Assignee"})
            continue
            
        parts = [p.strip() for p in re.split(r"[/,]", assign_text)]
        found = False
        for pt in parts:
            tk = normalize_name(pt).lower()
            if tk in member_lookup:
                found = True
                break
        
        if not found:
            unmatched.append({"order": p["order"], "assign": assign_text, "reason": "No match in Roster"})

    print(f"Total Projects: {len(projects)}")
    print(f"Unmatched Count: {len(unmatched)}")
    for u in unmatched:
        print(f"- Order: {u['order']} | Assignee: '{u['assign']}' | Reason: {u['reason']}")

if __name__ == "__main__":
    audit_unmatched()
