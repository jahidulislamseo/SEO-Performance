import time
from shared_utils import fetch_sheet_data_gviz, QUERY_SHEET_ID

sheet_names = ["Query Sheet", "Queries", "Sheet1", "Leads", "Query"]

for name in sheet_names:
    print(f"Checking sheet: {name}")
    rows = fetch_sheet_data_gviz(name, QUERY_SHEET_ID)
    if rows:
        print(f"Found {len(rows)} rows in '{name}'")
        print("Header:", rows[0] if rows else "Empty")
        print("First data row:", rows[1] if len(rows) > 1 else "No data")
        print("-" * 20)
    else:
        print(f"No data found in '{name}'")
