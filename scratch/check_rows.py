import pandas as pd

file_path = 'All Google Ads Orders - All Google Ads Orders.csv'
df = pd.read_csv(file_path)
# Look at rows around 7797
print(df.iloc[7790:7810, 0:5])
