import sys
sys.path.append('..')

from src.data.fetch_openaq import run_full_coverage_audit, _fetch_all_indonesia_locations
from src.config import CITIES, RAW_OPENAQ_DIR
import pandas as pd

# Cell 2
audit_df = run_full_coverage_audit()

# Cell 3
print(f"Total stations found: {len(audit_df)}")
print(f"\nCities covered: {audit_df['city'].unique()}")
print("\nDetailed view:")
print(audit_df[['city', 'name', 'is_monitor', 'has_pm25', 'has_pm10',
                'first_updated', 'last_updated']].sort_values('city').to_string())

# Cell 4
pm25_stations = audit_df[audit_df['has_pm25'] == True]
print(f"\nStations with PM2.5: {len(pm25_stations)}")
print(pm25_stations[['city', 'name', 'is_monitor', 'first_updated', 'last_updated']].to_string())

# Extra: debug Surabaya
print("\n--- Debug: Surabaya radius check ---")
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

sby_lat, sby_lon = CITIES['surabaya']['lat'], CITIES['surabaya']['lon']
all_locs = _fetch_all_indonesia_locations()
nearest = []
for loc in all_locs:
    coords = loc.get('coordinates') or {}
    lat = coords.get('latitude')
    lon = coords.get('longitude')
    if lat and lon:
        d = haversine(lat, lon, sby_lat, sby_lon)
        nearest.append((d, loc.get('name'), loc.get('id'), lat, lon))

nearest.sort()
print("5 closest locations to Surabaya:")
for d, name, lid, lat, lon in nearest[:5]:
    print(f"  {d:.1f} km — {name} (id={lid}) lat={lat} lon={lon}")
