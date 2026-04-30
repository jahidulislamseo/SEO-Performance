import pymongo
client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['seo_dashboard']
db['config'].update_one(
    {'_id': 'app_settings'}, 
    {'$set': {
        'team_targets': {
            'GEO Rankers': 6000, 
            'Rank Riser': 12000, 
            'Search Apex': 9000, 
            'Dark Rankers': 9000
        }
    }}, 
    upsert=True
)
print("Updated successfully")
