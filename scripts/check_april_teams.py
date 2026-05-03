import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()
cur_month = '2026-04'

projects = list(db.projects_archive.find({'month': cur_month}))
team_stats = {}

for p in projects:
    if str(p.get('status', '')).strip() == 'Delivered':
        team = p.get('team', 'Unknown')
        amt = float(p.get('amtX', 0) or 0)
        team_stats[team] = team_stats.get(team, 0) + amt

print(f"April 2026 Team Breakdown (Delivered):")
for team, amt in sorted(team_stats.items(), key=lambda x: x[1] if x[1] is not None else 0, reverse=True):
    tname = str(team) if team is not None else "Unknown"
    print(f"{tname:25}: ${amt:,.2f}")
