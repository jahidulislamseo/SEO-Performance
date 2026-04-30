import pymongo
import time

client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['seo_dashboard']

# Update app_settings
doc = db['config'].find_one({'_id': 'app_settings'})
if doc:
    targets = doc.get('team_targets', {})
    shifts = doc.get('team_shifts', {})
    
    changed = False
    if 'SMM' in targets:
        targets['Dark Rankers'] = targets.pop('SMM')
        changed = True
    if 'SMM' in shifts:
        shifts['Dark Rankers'] = shifts.pop('SMM')
        changed = True
        
    if changed:
        db['config'].update_one(
            {'_id': 'app_settings'}, 
            {'$set': {'team_targets': targets, 'team_shifts': shifts, 'updated_at': time.time()}}
        )
        print("Updated app_settings: Renamed SMM to Dark Rankers")
    else:
        print("No SMM found in app_settings targets or shifts")
else:
    print("app_settings document not found")

# Also check for any other docs
all_configs = list(db['config'].find())
for c in all_configs:
    if c.get('_id') == 'app_settings': continue
    t = c.get('team_targets', {})
    if 'SMM' in t:
        t['Dark Rankers'] = t.pop('SMM')
        db['config'].update_one({'_id': c['_id']}, {'$set': {'team_targets': t}})
        print(f"Updated config doc {c['_id']}")
