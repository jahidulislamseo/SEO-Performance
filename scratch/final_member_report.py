
import os, sys, json
sys.path.append(os.getcwd())
from shared_utils import get_db

def generate_report():
    db = get_db()
    mems = sorted(list(db['member_summaries'].find({}, {'_id': 0})), key=lambda x: x['deliveredAmt'], reverse=True)
    
    print("\n# [SEO & SMM] ALL MEMBER PERFORMANCE REPORT\n")
    print("| MEMBER NAME | DELIVERED ($) | WIP ($) | PROJECTS | STATUS |")
    print("| :--- | :--- | :--- | :--- | :--- |")
    
    for m in mems:
        name = m.get('name', 'N/A')
        deliv = m.get('deliveredAmt', 0.0)
        wip = m.get('wipAmt', 0.0)
        total = m.get('total', 0)
        print(f"| {name:<20} | ${deliv:>12,.2f} | ${wip:>10,.2f} | {total:>8} | (OK) |")

if __name__ == "__main__":
    generate_report()
