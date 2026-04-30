import pandas as pd
import json

file_path = r'c:\Users\Jahidul Islam\Downloads\jahidul\data_legacy\All Google Ads Orders - All Google Ads Orders.csv'

# Read with low_memory=False to handle mixed types
df = pd.read_csv(file_path, low_memory=False)

print("Columns found:")
print(df.columns.tolist())

print("\nFirst 5 rows:")
print(df.head().to_string())

print("\nSample values for key columns:")
for col in df.columns[:15]:
    samples = df[col].dropna().unique()[:5]
    print(f"{col}: {samples}")
