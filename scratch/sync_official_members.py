import sys
import os
sys.path.append(os.getcwd())
from shared_utils import get_db

db = get_db()

# Authorized members list from user feedback
authorized_members = [
    {"id": "17236", "name": "Alamin", "fullName": "Al Amin", "team": "SMM", "role": "SEO Executive"},
    {"id": "17136", "name": "Ibrahim", "fullName": "Ibrahim", "team": "SMM", "role": "SEO Executive"},
    {"id": "17235", "name": "Raj", "fullName": "Atikuzzaman", "team": "SMM", "role": "SEO Executive"},
    {"id": "17058", "name": "Turjo", "fullName": "Tohidul Islam Turjo", "team": "SMM", "role": "SEO Executive"},
    {"id": "17318", "name": "Saiful", "fullName": "Saiful islam sagor", "team": "SMM", "role": "SEO Executive"},
    {"id": "17233", "name": "Romjan", "fullName": "Md Romjanul Islam", "team": "SMM", "role": "SEO Executive"},
    {"id": "17238", "name": "Istiak ishq", "fullName": "Istiak", "team": "SMM", "role": "SEO Executive"},
    {"id": "17294", "name": "Sushant", "fullName": "Shosunth chakarborty", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17234", "name": "Sammi", "fullName": "Samiel hembrom", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17491", "name": "Samia", "fullName": "Samia ahmed", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17385", "name": "Pinky", "fullName": "Afsana Parvin Pinky", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17074", "name": "Reza", "fullName": "Ahmed Al Reza", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17541", "name": "Aritri", "fullName": "Aritri Biswas Sneha", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17046", "name": "Robel", "fullName": "Muhammad Ali Robel", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17152", "name": "Sobuz", "fullName": "MD.Sobuj Hossain", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17383", "name": "Istiak Ahmed", "fullName": "Istiak Ahmed Soikot", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17488", "name": "Wakil", "fullName": "Waqil Hafiz", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17049", "name": "Rasel", "fullName": "Rasel Mia", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17149", "name": "Gazi Fahim", "fullName": "Gazi Fahim Hasan", "team": "Rank Riser", "role": "SEO Executive"},
    {"id": "17492", "name": "Rezwan", "fullName": "Rezwan Ahmed", "team": "Search Apex", "role": "SEO Executive"},
    {"id": "17493", "name": "Jobaeid", "fullName": "Jobaeid Kha", "team": "Search Apex", "role": "SEO Executive"},
    {"id": "17299", "name": "Harun", "fullName": "Harun", "team": "Search Apex", "role": "SEO Executive"},
    {"id": "17317", "name": "Babu", "fullName": "Nishar Farazi Babu", "team": "Search Apex", "role": "SEO Executive"},
    {"id": "17369", "name": "Akash", "fullName": "ashiqur Rahaman", "team": "Search Apex", "role": "SEO Executive"},
    {"id": "17246", "name": "Sifat", "fullName": "M A Muyeed Sifat", "team": "Search Apex", "role": "SEO Executive"},
    {"id": "17301", "name": "Imran", "fullName": "Sheikh Al Imran", "team": "Search Apex", "role": "SEO Executive"},
    {"id": "17248", "name": "Tihim", "fullName": "Shihadul Islam Tihim", "team": "Search Apex", "role": "SEO Executive"},
    {"id": "17384", "name": "Sabit", "fullName": "MD SAIMUN SABED", "team": "GEO Rankers", "role": "SEO Executive"},
    {"id": "17524", "name": "Shourav", "fullName": "Shafiul Alam Shourav", "team": "GEO Rankers", "role": "SEO Executive"},
    {"id": "17135", "name": "Hasibul", "fullName": "Md. Hasibul Hasan Imon Hawlader", "team": "GEO Rankers", "role": "SEO Executive"},
    {"id": "17137", "name": "Jahidul", "fullName": "Md. Jahidul Islam", "team": "GEO Rankers", "role": "SEO Executive"},
    {"id": "17066", "name": "Komal", "fullName": "Komal Chandro Roy", "team": "GEO Rankers", "role": "SEO Executive"},
    {"id": "17490", "name": "Roni", "fullName": "Rony", "team": "GEO Rankers", "role": "SEO Executive"},
    {"id": "17021", "name": "Mehedi Hasan", "fullName": "Md. Mehedi Hasan", "team": "GEO Rankers", "role": "Project Manager"},
]

# 1. Mark all current members as isOfficial: False
db.members.update_many({}, {"$set": {"isOfficial": False}})

# 2. Update/Insert authorized members and mark as isOfficial: True
for m in authorized_members:
    db.members.update_one(
        {"id": m["id"]},
        {"$set": {
            "name": m["name"],
            "fullName": m["fullName"],
            "team": m["team"],
            "role": m["role"],
            "isOfficial": True
        }},
        upsert=True
    )

# 3. Also update member_summaries to match (Optional but good for immediate effect)
# Actually calculate_summaries should be run after this.

print(f"Updated {len(authorized_members)} members to isOfficial: True")
