import os, json, requests
from dotenv import load_dotenv
load_dotenv()
key = os.getenv('OPENAQ_API_KEY')
headers = {'X-API-Key': key}

# Filter dengan countries_id=1 (Indonesia)
r = requests.get('https://api.openaq.org/v3/locations', headers=headers,
    params={'countries_id': 1, 'limit': 10}, timeout=30)
data = r.json()
print('Total Indonesia locations:', data.get('meta', {}).get('found'))
print()
for loc in data.get('results', []):
    loc_id = loc['id']
    name = loc['name']
    locality = loc.get('locality')
    timezone = loc.get('timezone')
    sensors = [s['parameter']['name'] for s in loc.get('sensors', [])]
    dt_first = loc.get('datetimeFirst')
    dt_last = loc.get('datetimeLast')
    print(f"id={loc_id} name={name} locality={locality} timezone={timezone}")
    print(f"  sensors={sensors}  datetimeFirst={dt_first}  datetimeLast={dt_last}")
