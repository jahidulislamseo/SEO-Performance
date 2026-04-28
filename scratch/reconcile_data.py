from shared_utils import get_db
import json

db = get_db()

# 1. Total from members collection
members = list(db["members"].find())
total_delivered = sum(m.get("deliveredAmt", 0) for m in members)
total_wip = sum(m.get("wipAmt", 0) for m in members)
total_target = sum(m.get("target", 1100) for m in members)

print("--- MEMBERS COLLECTION TOTALS ---")
print(f"Count: {len(members)}")
print(f"Delivered: ${total_delivered:,.2f}")
print(f"WIP: ${total_wip:,.2f}")
print(f"Target: ${total_target:,.2f}")

# 2. Summary from dept_summary collection
summary = db["dept_summary"].find_one({"_id": "current_stats"})
print("\n--- DEPT_SUMMARY COLLECTION ---")
if summary:
    print(f"Total Achieved: ${summary.get('totalAchieved', 0):,.2f}")
    dept = summary.get("dept", {})
    print(f"Dept Target: ${dept.get('target', 0):,.2f}")
    print(f"Dept WIP: ${dept.get('wipAmt', 0):,.2f}")
else:
    print("No summary found")

# 3. Platform breakdown
if summary and "dept" in summary and "platformStats" in summary["dept"]:
    print("\n--- PLATFORM BREAKDOWN ---")
    ps = summary["dept"]["platformStats"]
    for p, val in ps.items():
        print(f"{p}: ${val:,.2f}")
    print(f"Sum of Platforms: ${sum(ps.values()):,.2f}")

# 4. Check for discrepancy
diff = abs(total_delivered - (summary.get('totalAchieved', 0) if summary else 0))
if diff > 1:
    print(f"\n[WARNING] Discrepancy detected: ${diff:,.2f}")
else:
    print("\n[OK] Data matches perfectly!")
