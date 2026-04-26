import os
from shared_utils import get_db

def update_leader_roles():
    """
    Updates specific members in the MongoDB 'members' collection 
    to set their role as 'Team Leader' and grant admin access.
    """
    db = get_db()
    
    # List of leaders to update based on Employee IDs
    leaders = [
        {"id": "17149", "name": "Gazi Fahim Hasan"},
        {"id": "17137", "name": "Md. Jahidul Islam"},
        {"id": "17248", "name": "Shihadul Islam Tihim"},
        {"id": "17238", "name": "Istiak"}
    ]
    
    print("Starting MongoDB update for leader roles...")
    for leader in leaders:
        emp_id = leader["id"]
        # Update role and admin flag. 
        # Using $in to catch string, float-as-string, and numeric IDs
        result = db["members"].update_many(
            {"id": {"$in": [emp_id, f"{emp_id}.0", int(emp_id) if emp_id.isdigit() else None]}},
            {"$set": {"role": "Team Leader", "isAdmin": True}}
        )
        print(f"ID {emp_id} ({leader['name']}): Matched {result.matched_count}, Updated {result.modified_count}")

if __name__ == "__main__":
    update_leader_roles()