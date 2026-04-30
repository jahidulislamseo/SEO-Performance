from api.shared_utils import get_db
db = get_db()
db['config'].update_one(
    {'_id': 'app_settings'}, 
    {'$set': {'dept_target': 600000.0}}, 
    upsert=True
)
print('Target updated to 600,000')
