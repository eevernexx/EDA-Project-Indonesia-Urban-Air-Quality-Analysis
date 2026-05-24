# src/config.py
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Paths ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
INTERIM_DIR = DATA_DIR / "interim"
PROCESSED_DIR = DATA_DIR / "processed"
EXTERNAL_DIR = DATA_DIR / "external"
REPORTS_DIR = BASE_DIR / "reports"

RAW_OPENAQ_DIR = RAW_DIR / "openaq"
RAW_BMKG_DIR = RAW_DIR / "bmkg"

# ── API ────────────────────────────────────────────────
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY")
OPENAQ_BASE_URL = "https://api.openaq.org/v3"

# ── Cities (Revised — Jakarta primary only) ────────────
CITIES = {
    "jakarta": {
        "name": "Jakarta",
        "lat": -6.2088,
        "lon": 106.8456,
        "openaq_name": "Jakarta",
        "timezone": "Asia/Jakarta",
    },
}

# ── Valid Stations (dari coverage audit) ───────────────
VALID_STATIONS = {
    # location_id : metadata
    # Jakarta — reference-grade monitors only
    # Jakarta Central: 2016–2025 (PRIMARY)
    # Jakarta South: 2022–2025 (PRIMARY)
    # West/East Jakarta Mayor Office: 2023–2025 (supplementary)
    # Rusunawa Marunda: 2023–2025 (supplementary)
}

# Station IDs — akan kita isi setelah fetch location IDs
# Untuk sekarang hardcode dari audit result
JAKARTA_MONITOR_NAMES = [
    "Jakarta Central",
    "Jakarta South",
    "West Jakarta Mayor Office",
    "East Jakarta Mayor Office",
    "Rusunawa Marunda",
]

# ── Date Range ─────────────────────────────────────────
DATE_FROM = "2019-01-01"
DATE_TO   = "2023-12-31"

# ── Parameters ─────────────────────────────────────────
AQ_PARAMETERS = ["pm25", "pm10"]

# ── PSBB Timeline Jakarta ──────────────────────────────
PSBB_PERIODS = {
    "jakarta": [
        {"start": "2020-04-10", "end": "2020-06-04", "phase": "strict"},
        {"start": "2020-06-05", "end": "2020-09-13", "phase": "transition"},
        {"start": "2020-09-14", "end": "2020-10-11", "phase": "strict"},
    ],
}

# ── WHO Guidelines ─────────────────────────────────────
WHO_PM25_ANNUAL = 5.0    # µg/m³
WHO_PM25_24H   = 15.0    # µg/m³
WHO_PM10_ANNUAL = 15.0   # µg/m³
WHO_PM10_24H   = 45.0    # µg/m³

# ── ISPU Breakpoints PM2.5 (Standar Indonesia) ─────────
ISPU_BREAKPOINTS_PM25 = [
    (0,     15.5,  0,   50,  "Baik"),
    (15.5,  55.4,  51,  100, "Sedang"),
    (55.4,  150.4, 101, 200, "Tidak Sehat"),
    (150.4, 250.4, 201, 300, "Sangat Tidak Sehat"),
    (250.4, 500.0, 301, 500, "Berbahaya"),
]
