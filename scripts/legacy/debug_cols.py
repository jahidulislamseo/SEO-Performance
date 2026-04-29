from shared_utils import fetch_sheet_data_gviz, SHEET_ID
import json

def debug_columns():
    print(f"Checking Spreadsheet: {SHEET_ID}")
    rows = fetch_sheet_data_gviz("Kam Data")
    if not rows:
        print("Could not fetch rows.")
        return
    
    print("\nFirst row (Header candidate):")
    print(rows[0])
    
    print("\nSecond row (Data candidate):")
    print(rows[1])
    
    # Check specifically for SEO/SMM in column 20
    print("\nChecking indices for row 2:")
    for i, val in enumerate(rows[1]):
        print(f"Col {i}: {val}")

if __name__ == "__main__":
    debug_columns()
