import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'c:\Users\Jahidul Islam\Downloads\jahidul\geo_data.json', encoding='utf-8') as f:
    data = json.load(f)

with open(r'c:\Users\Jahidul Islam\Downloads\jahidul\dashboard_template.html', encoding='utf-8') as f:
    html = f.read()

data_js = json.dumps(data, ensure_ascii=False, indent=2)
html = html.replace('__DATA_PLACEHOLDER__', data_js)

with open(r'c:\Users\Jahidul Islam\Downloads\jahidul\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("✅ index.html created successfully!")
