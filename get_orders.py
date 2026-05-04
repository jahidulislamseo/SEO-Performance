import os
import pandas as pd
from api.agent_engine import get_raw_dataframe

df = get_raw_dataframe()
df['calc_date'] = pd.to_datetime(df['date'].astype(str), errors='coerce')
mask_last_day = df['calc_date'].dt.is_month_end
df.loc[mask_last_day, 'calc_date'] = df.loc[mask_last_day, 'calc_date'] + pd.Timedelta(days=1)
df = df[(df['calc_date'] >= '2026-05-01') & (df['calc_date'] < '2026-06-01')]
df = df[df['service'].str.contains('SEO|SMM', case=False, na=False)]
d_df = df[df['status'] == 'Delivered']
print(d_df[['order_num', 'assign', 'amount_x']])
