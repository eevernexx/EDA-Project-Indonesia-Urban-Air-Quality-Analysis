# 🌫️ Jakarta Air Quality Dashboard
### PM2.5 Analysis 2019–2023 | COVID-19 as a Natural Experiment

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-Dashboard-FF4B4B?logo=streamlit&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![Statsmodels](https://img.shields.io/badge/Stats-Statsmodels%20%7C%20SciPy-8CAAE6)
![Status](https://img.shields.io/badge/status-portfolio%20project-success)

> An exploratory data analysis of Jakarta's air quality, using the COVID-19 lockdown as a natural experiment to isolate the effect of mobility restrictions on PM2.5.

---

## 📊 Project Overview

An exploratory data analysis of Jakarta's air quality using 5 years of daily PM2.5 measurements from a reference-grade monitoring station. The project uses the COVID-19 lockdown (PSBB) as a **natural experiment** to isolate the causal effect of mobility restrictions on air pollution — after controlling for weather and seasonality.

**Key Finding:** Jakarta's PSBB was associated with a statistically significant **17.4% reduction in PM2.5** (95% CI: -31.7% to -0.0%, p=0.050), after controlling for weather confounders — despite the naive before/after comparison showing virtually no change (-0.1%).

This repository ships **two front-ends** for the same analysis:
- A **Streamlit** multi-page dashboard (`app/`) for rapid, Python-native exploration.
- A **React + Vite + Tailwind** dashboard (`web/`) in Bahasa Indonesia, fed by static JSON exported from the analysis.

---

## 🎯 Key Insights

| Finding | Value | Method |
|---|---|---|
| Jakarta mean PM2.5 (2019–2022) | 38.0 µg/m³ | Descriptive stats |
| Above WHO Annual Guideline | **7.6×** | WHO threshold comparison |
| Days exceeding WHO 24h guideline | **89.8%** | Threshold analysis |
| Dry season vs wet season | **+41.5% higher** | Mann-Whitney U (p<0.001) |
| PSBB weather-adjusted effect | **-17.4% PM2.5** | Interrupted Time Series |
| Strongest weather driver | Precipitation (ρ=-0.47, lag-1) | Spearman correlation |
| Weekend vs weekday effect | Not significant (p=0.377) | Mann-Whitney U |

---

## 🗂️ Project Structure
```
EDA-Project-Indonesia-Urban-Air-Quality-Analysis/
├── data/
│   ├── raw/                 # Raw API responses (gitignored)
│   ├── interim/             # Intermediate artifacts (gitignored)
│   ├── processed/           # Analysis-ready master dataset (CSV + Parquet)
│   └── external/            # Reference data (PSBB timeline)
├── notebooks/
│   ├── 01_coverage_audit.ipynb      # OpenAQ data availability check
│   ├── 02_fetch_data.ipynb          # Data acquisition pipeline
│   ├── 03_data_cleaning.ipynb       # Cleaning & feature engineering
│   ├── 04_fetch_weather.ipynb       # Open-Meteo ERA5 weather data
│   ├── 05_eda_temporal.ipynb        # Trend & seasonal analysis
│   ├── 06_covid_analysis.ipynb      # ITS regression + counterfactual
│   └── 07_weather_correlation.ipynb # Weather–PM2.5 coupling
├── src/
│   ├── config.py            # Constants, paths, API config
│   ├── data/                # API clients & validators
│   │   ├── fetch_openaq.py  # OpenAQ API client
│   │   ├── fetch_bmkg.py    # BMKG / weather fetcher
│   │   └── validators.py
│   ├── analysis/            # Statistical analysis helpers
│   ├── processing/          # Cleaning & feature engineering
│   └── viz/                 # Plotting helpers
├── app/                     # Streamlit dashboard
│   ├── streamlit_app.py     # Main dashboard entry
│   ├── components/
│   └── pages/
│       ├── 1_Overview.py
│       ├── 2_Temporal_Trends.py
│       ├── 3_Weather_Impact.py
│       └── 4_COVID_Experiment.py
├── web/                     # React + Vite + Tailwind dashboard (Bahasa Indonesia)
│   ├── src/                 # App, pages, components, lib
│   └── public/data/         # Static JSON consumed by the web app
├── scripts/
│   └── export_web_data.py   # Exports analysis → static JSON for web/
├── reports/figures/         # Exported HTML charts
├── tests/
├── requirements.txt
└── runtime.txt              # Python 3.11 (Streamlit Cloud pin)
```

---

## 🔬 Methodology

### Data Sources
| Source | Data | Coverage |
|---|---|---|
| [OpenAQ API v3](https://openaq.org) | PM2.5 daily measurements | Jakarta Central, 2019–2023 |
| [Open-Meteo ERA5](https://open-meteo.com) | Weather reanalysis | Jakarta, 2019–2023 |

### Statistical Methods

**Trend Analysis**
- Ljung-Box test for autocorrelation (pre-test)
- Hamed-Rao Modified Mann-Kendall test (autocorrelation-corrected)
- Sen's slope estimator for trend magnitude

**Seasonal Analysis**
- Mann-Whitney U test (non-parametric, dry vs wet season)
- Monthly aggregation with bootstrap confidence intervals

**Weather Correlation**
- Spearman rank correlation (non-parametric, robust to outliers)
- Lag analysis for precipitation wet-deposition effect

**COVID-19 Natural Experiment**
- Interrupted Time Series (ITS) regression
- Log-transformed PM2.5 as dependent variable
- HAC standard errors (Newey-West, 14-day lag) for autocorrelation
- Controls: weather covariates + month fixed effects

### Data Quality
- Reference-grade monitor only (Jakarta Central, `location_id=8637`)
- Low-coverage days excluded (< 75% hourly completeness)
- Extreme values removed (> 500 µg/m³, sensor malfunction threshold)
- Overall coverage: 96.7% (2019–2022); 2023 excluded from trend analysis

### Known Limitations
- Single monitoring station — may not represent all Jakarta districts
- ITS confidence interval is borderline (-31.7% to -0.0%) — interpret cautiously
- No control city available for a Difference-in-Differences design
- Residual autocorrelation (DW=1.40), only partially addressed by HAC SE

---

## 🚀 Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/eevernexx/EDA-Project-Indonesia-Urban-Air-Quality-Analysis.git
cd EDA-Project-Indonesia-Urban-Air-Quality-Analysis
```

### 2. Streamlit dashboard (Python)
```bash
# Set up environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Run dashboard
streamlit run app/streamlit_app.py
```

### 3. Web dashboard (React + Vite)
```bash
cd web
npm install
npm run dev      # local dev server
npm run build    # production build → web/dist
```
> The web app reads pre-exported static JSON from `web/public/data/`.
> Regenerate it from the analysis with `python scripts/export_web_data.py`.

---

## 🛠️ Tech Stack

| Category | Tools |
|---|---|
| Data | Pandas, PyArrow, Requests |
| Statistics | SciPy, Statsmodels, PyMannKendall |
| Visualization | Plotly, Folium, Recharts |
| Dashboards | Streamlit, React + Vite + Tailwind CSS |
| Data Sources | OpenAQ API v3, Open-Meteo ERA5 |

---

## 👤 Author

**Aqsel** — Fresh Graduate, Informatics Engineering
Universitas Dian Nuswantoro (Udinus), Semarang

[![GitHub](https://img.shields.io/badge/GitHub-eevernexx-181717?logo=github&logoColor=white)](https://github.com/eevernexx)

---

## 📄 Related

- 🏎️ [F1 Race Strategy Dashboard](https://github.com/eevernexx) — FastF1 + Streamlit
- 📝 Medium Article: *When Jakarta's Sky Turned Blue* — coming soon

---

> **Disclaimer:** This analysis uses a single reference-grade monitoring station
> and should be interpreted as exploratory research, not definitive policy evidence.
