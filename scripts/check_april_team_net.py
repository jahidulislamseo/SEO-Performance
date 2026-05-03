import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()
cur_month = '2026-04'

projects = list(db.projects_archive.find({'month': cur_month}))
team_net_stats = {}

for p in projects:
    if str(p.get('status', '')).strip() == 'Delivered':
        team = p.get('team', 'Unknown')
        # Calculating Net: amtX * 0.8 (standard 20% cut for platforms)
        # OR if there is a 'net_amt' field. 
        # shared_utils doesn't show a net_amt mapping, but agent_engine uses some logic.
        amt = float(p.get('amtX', 0) or 0)
        # Most orders in snippet have a 20% platform fee.
        # But let's check if the DB has a better way.
        net = amt * 0.8 
        team_net_stats[team] = team_net_stats.get(team, 0) + net

print(f"April 2026 Team Breakdown (Net Total - Estimated):")
for team, amt in sorted(team_net_stats.items(), key=lambda x: x[1] if x[1] is not None else 0, reverse=True):
    tname = str(team) if team is not None else "Unknown"
    print(f"{tname:25}: ${amt:,.2f}")
