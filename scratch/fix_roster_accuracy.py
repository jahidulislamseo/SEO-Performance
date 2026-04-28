
import os, sys
sys.path.append(os.getcwd())
from shared_utils import get_db

def fix_roster():
    db = get_db()
    missing_names = [
        'Sushmoy', 'Mokaddis', 'Sozib', 'Sozon', 'Nahida', 'Meem', 'Rafia', 'Tanvir', 
        'Mamun', 'Niloy', 'Tamim', 'Maruf', 'Iqbal', 'Rifat', 'Khairul', 'Abir', 
        'Redoy', 'Mahdi', 'Peyas', 'Ibnul Rahat', 'Obaed', 'Osman', 'Munna', 'Yeamin', 
        'Rashed', 'Sadman', 'Amit', 'Abu Sufian', 'Sumon', 'Mahbub', 'Asif', 'Tushi', 
        'Nahian', 'Konkon', 'Sakib', 'Auny', 'Jarif', 'Puja', 'Sajib', 'Ahad', 'Sabil', 'Ohidul Haque'
    ]
    
    current_members = [m['name'].lower() for m in db['members'].find()]
    to_add = []
    
    for name in missing_names:
        if name.lower() not in current_members:
            to_add.append({
                "name": name,
                "team": "GEO Rankers", # Default to GEO Rankers for now
                "role": "Team Member",
                "id": f"EMP-{name.upper()[:3]}-{os.urandom(2).hex().upper()}"
            })
            
    if to_add:
        db['members'].insert_many(to_add)
        print(f"✅ Added {len(to_add)} missing members to the roster.")
    else:
        print("ℹ️ All members already exist in the roster.")

    # Update Aliases for better matching
    aliases = {
        "istak": "Istiak",
        "istak ahamed": "Istiak",
        "jobaed": "Jobaeid",
        "md. jahidul islam": "Jahidul",
        "ahsanul haque sabbir": "Sabit",
        "md. lavlu hossain": "Robel",
        "meem": "Meem",
        "sajib": "Sajib",
        "mokaddis": "Mokaddis",
        "sushmoy": "Sushmoy",
        "sohag matubber": "Sohag Matubber",
        "abu sufian": "Abu Sufian"
    }
    
    db["config"].update_one(
        {"_id": "app_settings"}, 
        {"$set": {"name_aliases": aliases}}, 
        upsert=True
    )
    print("✅ Aliases updated in config.")

if __name__ == "__main__":
    fix_roster()
