import requests
import json

try:
    res = requests.get("http://127.0.0.1:5000/api/query-tracker")
    data = res.json()
    print(json.dumps(data[:3], indent=2))
except Exception as e:
    print(f"Error: {e}")
