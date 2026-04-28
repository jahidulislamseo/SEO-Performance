import csv

file_path = 'All Google Ads Orders - All Google Ads Orders.csv'
with open(file_path, mode='r', encoding='utf-8') as f:
    reader = csv.reader(f)
    headers = next(reader)
    print("Headers:", headers)
    for i, row in enumerate(reader):
        print(f"Row {i+1}:", row)
        if i >= 1:
            break
