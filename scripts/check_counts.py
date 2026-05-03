import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.join(os.getcwd(), "api"))
from shared_utils import get_db

load_dotenv("api/.env")
db = get_db()
print(f"Total Members: {db.members.count_documents({})}")
print(f"Official Members: {db.members.count_documents({'isOfficial': True})}")
print(f"Member Summaries: {db.member_summaries.count_documents({})}")
