from shared_utils import get_db

db = get_db()
for coll in ['members', 'projects', 'dept_summary', 'attendance']:
    count = db[coll].count_documents({})
    print(f"{coll}: {count} documents")
