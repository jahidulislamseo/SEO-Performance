from shared_utils import get_db
import json

def check_one_member():
    db = get_db()
    m = db["member_summaries"].find_one()
    print(json.dumps(m, indent=2, default=str))

if __name__ == "__main__":
    check_one_member()
