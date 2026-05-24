# src/data/fetch_openaq.py
import time
import math
import requests
import pandas as pd
from tenacity import retry, stop_after_attempt, wait_exponential
from src.config import (
    OPENAQ_API_KEY,
    OPENAQ_BASE_URL,
    CITIES,
    AQ_PARAMETERS,
    DATE_FROM,
    DATE_TO,
    RAW_OPENAQ_DIR,
)

HEADERS = {"X-API-Key": OPENAQ_API_KEY} if OPENAQ_API_KEY else {}

# Indonesia country ID in OpenAQ v3
INDONESIA_COUNTRY_ID = 1


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _assign_city(lat, lon, radius_km=60) -> str | None:
    """Return city_key if coordinates fall within radius_km of a city center."""
    if lat is None or lon is None:
        return None
    best_city, best_dist = None, float("inf")
    for city_key, cfg in CITIES.items():
        d = _haversine_km(lat, lon, cfg["lat"], cfg["lon"])
        if d < best_dist:
            best_dist, best_city = d, city_key
    return best_city if best_dist <= radius_km else None


def _parse_location(loc: dict, city_key: str) -> dict:
    """Normalize a v3 location object to a flat audit row."""
    coords = loc.get("coordinates") or {}
    sensors = [s["parameter"]["name"] for s in loc.get("sensors", [])]
    dt_first = (loc.get("datetimeFirst") or {}).get("utc")
    dt_last = (loc.get("datetimeLast") or {}).get("utc")
    return {
        "location_id": loc.get("id"),
        "name": loc.get("name"),
        "city": CITIES[city_key]["name"],
        "city_key": city_key,
        "locality": loc.get("locality"),
        "first_updated": dt_first,
        "last_updated": dt_last,
        "parameters": sensors,
        "is_monitor": loc.get("isMonitor", False),
        "is_mobile": loc.get("isMobile", False),
        "lat": coords.get("latitude"),
        "lon": coords.get("longitude"),
        "has_pm25": "pm25" in sensors,
        "has_pm10": "pm10" in sensors,
    }


# ── 1. Coverage Audit ───────────────────────────────────────────────────────
def audit_city_coverage(city_key: str, all_indonesia: list[dict]) -> pd.DataFrame:
    """
    Filter pre-fetched Indonesia locations to those near city_key.
    """
    city_cfg = CITIES[city_key]
    rows = []
    for loc in all_indonesia:
        coords = loc.get("coordinates") or {}
        lat = coords.get("latitude")
        lon = coords.get("longitude")
        assigned = _assign_city(lat, lon)
        if assigned == city_key:
            rows.append(_parse_location(loc, city_key))

    if not rows:
        print(f"[WARNING] No locations found near {city_cfg['name']}")
        return pd.DataFrame()

    return pd.DataFrame(rows)


def _fetch_all_indonesia_locations() -> list[dict]:
    """Fetch all Indonesia locations from OpenAQ v3 (paginated)."""
    all_locs = []
    page = 1
    while True:
        r = requests.get(
            f"{OPENAQ_BASE_URL}/locations",
            headers=HEADERS,
            params={"countries_id": INDONESIA_COUNTRY_ID, "limit": 1000, "page": page},
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        results = data.get("results", [])
        if not results:
            break
        all_locs.extend(results)
        if len(results) < 1000:
            break
        page += 1
        time.sleep(0.5)
    return all_locs


def run_full_coverage_audit() -> pd.DataFrame:
    """Run coverage audit for all cities and save report."""
    print("Fetching all Indonesia locations from OpenAQ v3...")
    all_indonesia = _fetch_all_indonesia_locations()
    print(f"Total Indonesia locations retrieved: {len(all_indonesia)}")

    all_audits = []
    for city_key in CITIES:
        print(f"Auditing {city_key}...")
        df = audit_city_coverage(city_key, all_indonesia)
        if not df.empty:
            all_audits.append(df)
        time.sleep(0.3)

    if not all_audits:
        print("[ERROR] No data found for any city.")
        return pd.DataFrame()

    full_audit = pd.concat(all_audits, ignore_index=True)

    audit_path = RAW_OPENAQ_DIR / "coverage_audit.csv"
    full_audit.to_csv(audit_path, index=False)
    print(f"\nCoverage audit saved to: {audit_path}")
    print(f"\nSummary by city:")
    summary = full_audit.groupby("city_key").agg(
        total=("location_id", "count"),
        pm25_stations=("has_pm25", "sum"),
        pm10_stations=("has_pm10", "sum"),
        monitors=("is_monitor", "sum"),
    )
    print(summary.to_string())
    return full_audit


# ── 2. Fetch Measurements ───────────────────────────────────────────────────
# OpenAQ v3 removed the global /measurements endpoint.
# Measurements must be fetched per-sensor: /v3/sensors/{sensor_id}/measurements

def _get_location_sensors(location_id: int) -> list[dict]:
    """Return sensor dicts [{sensor_id, parameter}] for AQ_PARAMETERS."""
    r = requests.get(
        f"{OPENAQ_BASE_URL}/locations/{location_id}",
        headers=HEADERS,
        timeout=30,
    )
    r.raise_for_status()
    results = r.json().get("results", [])
    if not results:
        return []
    sensors = []
    for s in results[0].get("sensors", []):
        param = s.get("parameter", {}).get("name", "")
        if param in AQ_PARAMETERS:
            sensors.append({"sensor_id": s["id"], "parameter": param})
    return sensors


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=2, min=8, max=120))
def _fetch_daily_page(sensor_id: int, page: int) -> dict:
    """
    Fetch one page of DAILY aggregates for a sensor.

    Note: OpenAQ v3 ignores date_from/date_to on these endpoints, so we
    fetch the sensor's full daily history and filter client-side. Daily
    granularity keeps the result small (<1 page/year), avoiding the deep-
    pagination timeouts that the raw /measurements endpoint hits.
    """
    r = requests.get(
        f"{OPENAQ_BASE_URL}/sensors/{sensor_id}/measurements/daily",
        headers=HEADERS,
        params={"limit": 1000, "page": page},
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def fetch_location_history(
    location_id: int,
    city_key: str,
    date_from: str = DATE_FROM,
    date_to: str = DATE_TO,
) -> pd.DataFrame:
    """
    Fetch daily measurement history for a location, filtered to [date_from, date_to].
    Idempotent — resumes from cache if already downloaded.
    """
    cache_file = RAW_OPENAQ_DIR / f"{city_key}_loc{location_id}_{date_from}_{date_to}.parquet"

    if cache_file.exists():
        print(f"  [CACHE] Loading from cache: {cache_file.name}")
        return pd.read_parquet(cache_file)

    sensors = _get_location_sensors(location_id)
    if not sensors:
        print(f"  No {AQ_PARAMETERS} sensors found for location {location_id}")
        return pd.DataFrame()

    all_results = []
    for sensor_info in sensors:
        sensor_id = sensor_info["sensor_id"]
        param = sensor_info["parameter"]
        sensor_count = 0
        page = 1
        print(f"  {param} (sensor_id={sensor_id}) page ", end="", flush=True)

        while True:
            print(f"{page}...", end="", flush=True)
            data = _fetch_daily_page(sensor_id, page)
            results = data.get("results", [])

            if not results:
                break

            for rec in results:
                rec["parameter_name"] = param

            all_results.extend(results)
            sensor_count += len(results)

            if len(results) < 1000:
                break

            page += 1
            time.sleep(0.6)

        print(f" done ({sensor_count:,} daily records)")
        time.sleep(0.3)

    if not all_results:
        return pd.DataFrame()

    df = pd.json_normalize(all_results)

    # Server ignores date params — filter to requested window client-side.
    dt_col = "period.datetimeFrom.utc"
    if dt_col in df.columns:
        ts = pd.to_datetime(df[dt_col], utc=True, errors="coerce")
        mask = (ts >= pd.Timestamp(date_from, tz="UTC")) & (
            ts <= pd.Timestamp(f"{date_to} 23:59:59", tz="UTC")
        )
        df = df[mask].reset_index(drop=True)

    df.to_parquet(cache_file)
    return df


def fetch_city_data(city_key: str, audit_df: pd.DataFrame) -> pd.DataFrame:
    """
    Fetch data for all valid stations in a city.
    Only fetches stationary stations with pm25.
    """
    city_audit = audit_df[
        (audit_df["city_key"] == city_key) &
        (audit_df["has_pm25"] == True) &
        (audit_df["is_mobile"] == False)
    ]

    if city_audit.empty:
        print(f"[WARNING] No valid PM2.5 stations for {city_key}")
        return pd.DataFrame()

    print(f"\n{city_key}: {len(city_audit)} stations found")
    all_dfs = []

    for _, row in city_audit.iterrows():
        print(f"  Station: {row['name']} (id={row['location_id']})")
        df = fetch_location_history(int(row["location_id"]), city_key)
        if not df.empty:
            df["city"] = city_key
            df["station_name"] = row["name"]
            df["is_monitor"] = row["is_monitor"]
            all_dfs.append(df)

    if not all_dfs:
        return pd.DataFrame()

    return pd.concat(all_dfs, ignore_index=True)


def fetch_all_cities(audit_df: pd.DataFrame) -> pd.DataFrame:
    """Fetch data for all cities."""
    all_city_dfs = []

    for city_key in CITIES:
        print(f"\n{'='*50}")
        print(f"Fetching: {city_key.upper()}")
        print(f"{'='*50}")
        df = fetch_city_data(city_key, audit_df)
        if not df.empty:
            all_city_dfs.append(df)

    if not all_city_dfs:
        print("[ERROR] No data fetched for any city.")
        return pd.DataFrame()

    combined = pd.concat(all_city_dfs, ignore_index=True)
    output_path = RAW_OPENAQ_DIR / "raw_combined.parquet"
    combined.to_parquet(output_path)
    print(f"\nRaw data saved to: {output_path}")
    print(f"   Total records: {len(combined):,}")
    return combined
