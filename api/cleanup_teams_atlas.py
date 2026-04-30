import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "seo_dashboard"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Update app_settings
print(f"Connecting to {DB_NAME}...")
doc = db['config'].find_one({'_id': 'app_settings'})
if doc:
    targets = doc.get('team_targets', {})
    shifts = doc.get('team_shifts', {})
    
    changed = False
    # Team name rename
    if 'SMM' in targets:
        targets['Dark Rankers'] = targets.pop('SMM')
        changed = True
    if 'SMM' in shifts:
        shifts['Dark Rankers'] = shifts.pop('SMM')
        changed = True
        
    if changed:
        db['config'].update_one(
            {'_id': 'app_settings'}, 
            {'$set': {'team_targets': targets, 'team_shifts': shifts}}
        )
        print("Updated app_settings: Renamed SMM to Dark Rankers")
    else:
        print("No SMM found in app_settings targets or shifts")
else:
    print("app_settings document not found")

# Update members
res = db['members'].update_many({'team': 'SMM'}, {'$set': {'team': 'Dark Rankers'}})
print(f"Updated {res.modified_count} members from SMM to Dark Rankers")

# Update any project records if needed
res = db['projects_archive'].update_many({'team': 'SMM'}, {'$set': {'team': 'Dark Rankers'}})
print(f"Updated {res.modified_count} archive records from SMM to Dark Rankers")

print("Cleanup Complete")
