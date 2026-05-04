import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('api/.env')
client = MongoClient(os.getenv('MONGO_URI'))
db = client['seo_dashboard']

# Check member_summaries for Hasibul
hasibul = db['member_summaries'].find_one({'name': {'$regex': 'Hasibul', '$options': 'i'}})
print("=== HASIBUL MEMBER SUMMARY ===")
if hasibul:
    print(f"Name: {hasibul.get('name')}, Team: {hasibul.get('team')}, Delivered: {hasibul.get('delivered')}, DeliveredAmt: {hasibul.get('deliveredAmt')}")
else:
    print("NOT FOUND in member_summaries")

# Check GEO Rankers team_summaries
team = db['team_summaries'].find_one({'_id': 'current_stats'})
if team:
    geo = team.get('teams', {}).get('GEO Rankers', {})
    print("\n=== GEO RANKERS TEAM SUMMARY ===")
    print(f"Delivered: {geo.get('delivered')}, DeliveredAmt: {geo.get('deliveredAmt')}, Projects: {geo.get('projects')}")

# Check what op_dept the delivered orders in May archive have
docs = list(db['projects_archive'].find({'status': 'Delivered', 'month': '2026-05'}, {'assign': 1, 'team': 1, 'amtX': 1, 'order': 1, '_id': 0}))
print("\n=== MAY DELIVERED IN ARCHIVE ===")
for d in docs[:5]:
    print(f"Order: {d.get('order')} | Assign: {d.get('assign')} | Team(op_dept): {d.get('team')} | Amount: {d.get('amtX')}")
