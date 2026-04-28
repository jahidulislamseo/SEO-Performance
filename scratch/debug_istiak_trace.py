
import os, sys, re, json, time, pandas as pd
sys.path.append(os.getcwd())
from shared_utils import fetch_sheet_data_gviz, safe_float, normalize_assignee_token, get_db

def debug_istiak():
    db = get_db()
    rows = fetch_sheet_data_gviz('Kam Data')
    cols = ['id','name','team','date','5','6','profile','8','9','10','client','12','13','order_num','order_link','instruction','16','17','assign','status','service','del_by','del_date','amount_x','24','25','26','27']
    df = pd.DataFrame(rows[1:], columns=cols)
    
    # Apply agent_engine filters
    df = df[df['service'].str.contains('SEO|SMM', case=False, na=False)]
    df['calc_date_str'] = df.apply(lambda r: str(r.get('del_date', '')) if str(r.get('status')).strip() == 'Delivered' else str(r.get('date', '')), axis=1)
    df['calc_date'] = pd.to_datetime(df['calc_date_str'], errors='coerce')
    
    current_start = pd.Timestamp("2026-04-01")
    next_month = pd.Timestamp("2026-05-01")
    df = df[(df['calc_date'] >= current_start) & (df['calc_date'] < next_month)].copy()
    
    print(f"DEBUG: Total rows in April for SEO/SMM: {len(df)}")
    
    # Search for Istiak in these filtered rows
    istiak_rows = df[df['assign'].str.contains('Istiak Ishq', case=False, na=False)]
    print(f"DEBUG: Rows for Istiak Ishq: {len(istiak_rows)}")
    
    if not istiak_rows.empty:
        for _, r in istiak_rows.iterrows():
            print(f"Found Row: {r['order_num']} | {r['status']} | {r['amount_x']}")
    else:
        # Check WHY he's missing
        all_istiak = [r for r in rows if 'Istiak Ishq' in str(r)]
        print(f"DEBUG: Total Istiak Ishq rows in WHOLE SHEET: {len(all_istiak)}")
        if all_istiak:
            for r in all_istiak[:2]:
                print(f"Sheet Row Sample: Status={r[19]}, Service={r[20]}, Date={r[3]}, DelDate={r[22]}")

if __name__ == "__main__":
    debug_istiak()
