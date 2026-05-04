import sys, os
import pandas as pd
from agent_engine import get_raw_dataframe
df = get_raw_dataframe()
df['calc_date'] = pd.to_datetime(df['date'].astype(str), errors='coerce')
mask_last_day = df['calc_date'].dt.is_month_end
df.loc[mask_last_day, 'calc_date'] = df.loc[mask_last_day, 'calc_date'] + pd.Timedelta(days=1)
df = df[(df['calc_date'] >= '2026-05-01') & (df['calc_date'] < '2026-06-01')]
geo_df = df[df['op_dept'].astype(str).str.contains('Geo', case=False, na=False)]
print(f'Total GEO Rankers orders in May: {len(geo_df)}')
