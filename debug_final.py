import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('api/.env')
client = MongoClient(os.getenv('MONGO_URI'))
db = client['seo_dashboard']

team = db['team_summaries'].find_one({'_id': 'current_stats'})
if team:
    for t_name, t_data in team.get('teams', {}).items():
        print(f"Team: {t_name} | DeliveredAmt: {t_data.get('deliveredAmt')} | DeliveredCount: {t_data.get('delivered')}")
