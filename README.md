# 🌫️ Jakarta Air Quality Dashboard
### PM2.5 Analysis 2019–2023 | COVID-19 as a Natural Experiment

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://your-app-url.streamlit.app)

---

## 📊 Project Overview

An exploratory data analysis of Jakarta's air quality using 5 years of daily PM2.5 measurements from a reference-grade monitoring station. The project uses COVID-19 lockdown (PSBB) as a **natural experiment** to isolate the causal effect of mobility restrictions on air pollution — after controlling for weather and seasonality.

**Key Finding:** Jakarta's PSBB was associated with a statistically significant **17.4% reduction in PM2.5** (95%CI: -31.7% to -0.0%, p=0.050), after controlling for weather confounders — despite the naive before/after comparison showing virtually no change (-0.1%).

---

## 🎯 Key Insights

| Finding | Value | Method |
|---|---|---|
| Jakarta mean PM2.5 (2019–2022) | 38.0 µg/m³ | Descriptive stats |
| Above WHO Annual Guideline | **7.6x** | WHO threshold comparison |
| Days exceeding WHO 24h guideline | **89.8%** | Threshold analysis |
| Dry season vs wet season | **+41.5% higher** | Mann-Whitney U (p<0.001) |
| PSBB weather-adjusted effect | **-17.4% PM2.5** | Interrupted Time Series |
| Strongest weather driver | Precipitation (ρ=-0.47, lag-1) | Spearman correlation |
| Weekend vs weekday effect | Not significant (p=0.377) | Mann-Whitney U |

---

## 🗂️ Project Structure
```
indonesia-air-quality-eda/
├── data/
│   ├── raw/openaq/          # Raw API responses (gitignored)
│   ├── processed/           # Analysis-ready master dataset
│   └── external/            # Reference data (PSBB timeline)
├── notebooks/
│   ├── 01_coverage_audit.ipynb      # OpenAQ data availability check
│   ├── 02_fetch_data.ipynb          # Data acquisition pipeline
│   ├── 03_data_cleaning.ipynb       # Cleaning & feature engineering
│   ├── 04_fetch_weather.ipynb       # Open-Meteo ERA5 weather data
│   ├── 05_eda_temporal.ipynb        # Trend & seasonal analysis
│   ├── 06_covid_analysis.ipynb      # ITS regression + counterfactual
│   └── 07_weather_correlation.ipynb # Weather-PM2.5 coupling
├── src/
│   ├── config.py            # Constants, paths, API config
│   └── data/
│       ├── fetch_openaq.py  # OpenAQ API client
│       └── fetch_weather.py # Open-Meteo fetcher
├── app/
│   ├── streamlit_app.py     # Main dashboard entry
│   └── pages/
│       ├── 1_Overview.py
│       ├── 2_Temporal_Trends.py
│       ├── 3_Weather_Impact.py
│       └── 4_COVID_Experiment.py
└── reports/figures/         # Exported HTML charts
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
- Lag analysis for precipitation wet deposition effect

**COVID-19 Natural Experiment**
- Interrupted Time Series (ITS) regression
- Log-transformed PM2.5 as dependent variable
- HAC standard errors (Newey-West, 14-day lag) for autocorrelation
- Controls: weather covariates + month fixed effects

### Data Quality
- Reference-grade monitor only (Jakarta Central, location_id=8637)
- Low-coverage days excluded (< 75% hourly completeness)
- Extreme values removed (> 500 µg/m³, sensor malfunction threshold)
- Overall coverage: 96.7% (2019–2022), 2023 excluded from trend analysis

### Known Limitations
- Single monitoring station — may not represent all Jakarta districts
- ITS confidence interval borderline (-31.7% to -0.0%) — interpret cautiously
- No control city available for Difference-in-Differences design
- Residual autocorrelation (DW=1.40), partially addressed by HAC SE

---

## 🚀 Run Locally

```bash
# Clone repo
git clone https://github.com/eevernexx/jakarta-air-quality-eda.git
cd jakarta-air-quality-eda

# Setup environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run dashboard
streamlit run app/streamlit_app.py
```

---

## 🛠️ Tech Stack

| Category | Tools |
|---|---|
| Data | Pandas, PyArrow, Requests |
| Statistics | SciPy, Statsmodels, PyMannKendall |
| Visualization | Plotly, Folium |
| Dashboard | Streamlit |
| Data Sources | OpenAQ API v3, Open-Meteo ERA5 |

---

## 👤 Author

**Aqsel** — Fresh Graduate, Informatics Engineering  
Universitas Dian Nuswantoro (Udinus), Semarang  

[![GitHub](https://img.shields.io/badges/github)](https://github.com/eevernexx)

---

## 📄 Related

- 🏎️ [F1 Race Strategy Dashboard](https://github.com/eevernexx) — FastF1 + Streamlit
- 📝 Medium Article: *When Jakarta's Sky Turned Blue* — coming soon

---

> **Disclaimer:** This analysis uses a single reference-grade monitoring station
> and should be interpreted as exploratory research, not definitive policy evidence.
