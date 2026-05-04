import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('api/.env')
client = MongoClient(os.getenv('MONGO_URI'))
db = client['seo_dashboard']

# Check ALL member_summaries teams
members = list(db['member_summaries'].find({}, {'name': 1, 'team': 1, 'deliveredAmt': 1, '_id': 0}))
print("=== ALL MEMBER TEAM NAMES IN DB ===")
teams_found = set()
for m in members:
    teams_found.add(m.get('team'))
print("Unique teams:", teams_found)

print("\n=== MEMBERS WITH deliveredAmt > 0 ===")
for m in members:
    if (m.get('deliveredAmt') or 0) > 0:
        print(f"Name: {m.get('name')}, Team: '{m.get('team')}', DeliveredAmt: {m.get('deliveredAmt')}")

# Check team_summaries keys
team = db['team_summaries'].find_one({'_id': 'current_stats'})
if team:
    print("\n=== TEAM_SUMMARIES KEYS ===")
    print(list(team.get('teams', {}).keys()))
