import pandas as pd
from shared_utils import fetch_sheet_data_gviz, COL
import re

rows = fetch_sheet_data_gviz('Kam Data')
df = pd.DataFrame(rows).rename(columns={v: k for k, v in COL.items()})

def parse_date(d):
    try: return pd.to_datetime(d)
    except: return pd.NaT

df['date_dt'] = df['date'].apply(parse_date)
df = df.dropna(subset=['date_dt'])

from datetime import datetime
current_month = datetime(2026, 4, 1)
df = df[df['date_dt'].dt.month == current_month.month]

# Find how many rows don't get matched
import agent_engine
expanded = agent_engine.parse_assigns(df)
edf = pd.DataFrame(expanded)
matched_orders = set(edf['order_num']) if not edf.empty else set()
all_orders = set(df['order_num'])
unmatched_orders = all_orders - matched_orders
print(f"Total unique orders: {len(all_orders)}")
print(f"Matched unique orders: {len(matched_orders)}")
print(f"Unmatched unique orders: {len(unmatched_orders)}")
for o in unmatched_orders:
    print(f"Unmatched: {o}")
