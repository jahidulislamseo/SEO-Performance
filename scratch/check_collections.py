from shared_utils import get_db

db = get_db()
print(f"Collections in {db.name}:")
print(db.list_collection_names())
