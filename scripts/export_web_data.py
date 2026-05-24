"""Export analysis results to JSON for the React web dashboard.

Replicates the exact computations used by the Streamlit pages so the React
app shows identical numbers. Run from the project root:

    python scripts/export_web_data.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf
from scipy import stats

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "data" / "processed" / "jakarta_master.csv"
OUT_DIR = ROOT / "web" / "public" / "data"

WHO_ANNUAL = 5.0
WHO_24H = 15.0


def load() -> pd.DataFrame:
    df = pd.read_csv(CSV, parse_dates=["date"])
    return df.set_index("date")


def round_or_none(v, n=2):
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return None
    return round(float(v), n)


def export_overview(df: pd.DataFrame) -> dict:
    dv = df["2019":"2022"].dropna(subset=["pm25_mean"])

    overall_mean = dv["pm25_mean"].mean()
    pct_exceed = (dv["pm25_mean"] > WHO_24H).mean() * 100
    worst_day = dv["pm25_mean"].max()
    worst_date = dv["pm25_mean"].idxmax().strftime("%d %b %Y")
    annual_means = dv.groupby("year")["pm25_mean"].mean()

    annual = dv.groupby("year")["pm25_mean"].agg(["mean", "std"]).reset_index()
    annual_chart = [
        {"year": int(r["year"]), "mean": round(r["mean"], 1), "std": round(r["std"], 1)}
        for _, r in annual.iterrows()
    ]

    table = dv.groupby("year")["pm25_mean"].agg([
        "count", "mean", "median", "std",
        lambda x: x.quantile(0.25),
        lambda x: x.quantile(0.75),
        lambda x: (x > WHO_24H).mean() * 100,
    ]).round(2)
    table.columns = ["count", "mean", "median", "std", "q25", "q75", "pct_exceed"]
    table_rows = [
        {"year": int(idx), **{k: round(float(v), 1) for k, v in row.items()}}
        for idx, row in table.iterrows()
    ]

    return {
        "kpis": {
            "overall_mean": round(overall_mean, 1),
            "who_multiple": round(overall_mean / WHO_ANNUAL, 1),
            "pct_exceed": round(pct_exceed, 1),
            "worst_day": round(worst_day, 0),
            "worst_date": worst_date,
            "best_annual_mean": round(annual_means.min(), 1),
            "best_annual_year": int(annual_means.idxmin()),
        },
        "annual_chart": annual_chart,
        "table": table_rows,
        "who": {"annual": WHO_ANNUAL, "h24": WHO_24H, "ispu": 35},
    }


def export_temporal(df: pd.DataFrame) -> dict:
    d = df["2019":"2022"]
    series = [
        {"date": idx.strftime("%Y-%m-%d"),
         "pm25": round_or_none(v, 1)}
        for idx, v in d["pm25_mean"].items()
    ]

    dv = d.dropna(subset=["pm25_mean"])
    month_names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
                   "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    pivot = dv.groupby(["year", "month"])["pm25_mean"].mean().unstack()
    heatmap = []
    for year, row in pivot.iterrows():
        cells = []
        for m in range(1, 13):
            val = row.get(m, np.nan)
            cells.append(round_or_none(val, 1))
        heatmap.append({"year": int(year), "values": cells})

    return {
        "series": series,
        "heatmap": {"months": month_names, "rows": heatmap},
        "psbb_periods": [
            {"start": "2020-04-10", "end": "2020-06-04", "label": "PSBB Strict", "kind": "strict"},
            {"start": "2020-06-05", "end": "2020-09-13", "label": "PSBB Transition", "kind": "transition"},
            {"start": "2020-09-14", "end": "2020-10-11", "label": "PSBB Strict 2", "kind": "strict"},
        ],
        "who": {"h24": WHO_24H},
    }


def export_weather(df: pd.DataFrame) -> dict:
    d = df["2019":"2022"].dropna(subset=["pm25_mean"])

    weather_vars = {
        "precipitation": "Curah Hujan (mm)",
        "humidity_mean": "Kelembapan (%)",
        "windspeed_max": "Kecepatan Angin (km/jam)",
        "temp_mean": "Suhu (°C)",
    }
    corr = []
    for var, label in weather_vars.items():
        rho, pval = stats.spearmanr(d["pm25_mean"], d[var], nan_policy="omit")
        corr.append({
            "variable": label,
            "rho": round(rho, 3),
            "pval": round(pval, 4),
            "direction": "reduces" if rho < 0 else "increases",
        })
    corr.sort(key=lambda x: x["rho"])

    dry = d[d["season"] == "dry"]["pm25_mean"]
    wet = d[d["season"] == "wet"]["pm25_mean"]
    diff_pct = (dry.mean() - wet.mean()) / wet.mean() * 100
    _, mw_p = stats.mannwhitneyu(dry, wet, alternative="greater")

    def box_stats(s: pd.Series) -> dict:
        return {
            "min": round(s.min(), 1),
            "q1": round(s.quantile(0.25), 1),
            "median": round(s.median(), 1),
            "q3": round(s.quantile(0.75), 1),
            "max": round(s.max(), 1),
            "mean": round(s.mean(), 1),
        }

    return {
        "correlations": corr,
        "season": {
            "dry": box_stats(dry),
            "wet": box_stats(wet),
            "diff_pct": round(diff_pct, 1),
            "mannwhitney_p": round(float(mw_p), 4),
        },
    }


def export_covid(df: pd.DataFrame) -> dict:
    covid_df = df["2019":"2021"].copy().reset_index()

    PSBB_START = pd.Timestamp("2020-04-10")
    PSBB_END_STRICT = pd.Timestamp("2020-06-04")
    PSBB_END_ALL = pd.Timestamp("2020-10-11")

    covid_df["T"] = (covid_df["date"] - covid_df["date"].min()).dt.days
    covid_df["D"] = (covid_df["date"] >= PSBB_START).astype(int)
    covid_df["P"] = np.where(
        covid_df["date"] >= PSBB_START,
        (covid_df["date"] - PSBB_START).dt.days, 0,
    )
    covid_df["log_pm25"] = np.log(covid_df["pm25_mean"])
    covid_df["month"] = covid_df["date"].dt.month

    pre = covid_df[covid_df["date"] < PSBB_START]["pm25_mean"].dropna()
    during = covid_df[(covid_df["date"] >= PSBB_START)
                      & (covid_df["date"] <= PSBB_END_STRICT)]["pm25_mean"].dropna()
    post = covid_df[covid_df["date"] > PSBB_END_ALL]["pm25_mean"].dropna()
    naive = (during.mean() - pre.mean()) / pre.mean() * 100

    model_data = covid_df.dropna(subset=[
        "log_pm25", "temp_mean", "precipitation", "windspeed_max", "humidity_mean"
    ]).copy()
    dummies = pd.get_dummies(model_data["month"], prefix="m", drop_first=True, dtype=int)
    model_data = pd.concat([model_data, dummies], axis=1)
    month_cols = [c for c in model_data.columns if c.startswith("m_")]
    weather = "temp_mean + precipitation + windspeed_max + humidity_mean"
    months = " + ".join(month_cols)
    formula = f"log_pm25 ~ T + D + P + {weather} + {months}"
    model = smf.ols(formula=formula, data=model_data).fit(
        cov_type="HAC", cov_kwds={"maxlags": 14}
    )

    D_coef = model.params["D"]
    D_pval = model.pvalues["D"]
    D_ci = model.conf_int().loc["D"]
    effect_pct = (np.exp(D_coef) - 1) * 100
    ci_lo = (np.exp(D_ci[0]) - 1) * 100
    ci_hi = (np.exp(D_ci[1]) - 1) * 100

    cf = model_data.copy()
    cf["D"] = 0
    cf["P"] = 0
    md = model_data.copy()
    md["predicted"] = np.exp(model.predict(md))
    md["counterfactual"] = np.exp(model.predict(cf))

    series = [
        {"date": r["date"].strftime("%Y-%m-%d"),
         "observed": round_or_none(r["pm25_mean"], 1),
         "predicted": round_or_none(r["predicted"], 1),
         "counterfactual": round_or_none(r["counterfactual"], 1)}
        for _, r in md.iterrows()
    ]

    return {
        "puzzle": {
            "pre_mean": round(pre.mean(), 1),
            "during_mean": round(during.mean(), 1),
            "post_mean": round(post.mean(), 1),
            "naive_pct": round(naive, 1),
        },
        "its": {
            "effect_pct": round(effect_pct, 1),
            "ci_lo": round(ci_lo, 1),
            "ci_hi": round(ci_hi, 1),
            "pval": round(float(D_pval), 4),
            "significant": bool(D_pval < 0.05),
        },
        "series": series,
        "psbb_periods": [
            {"start": "2020-04-10", "end": "2020-06-04", "label": "PSBB Strict", "kind": "strict"},
            {"start": "2020-06-05", "end": "2020-10-11", "label": "PSBB Transition", "kind": "transition"},
        ],
    }


def main():
    df = load()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    exports = {
        "overview.json": export_overview(df),
        "temporal.json": export_temporal(df),
        "weather.json": export_weather(df),
        "covid.json": export_covid(df),
    }
    for name, payload in exports.items():
        path = OUT_DIR / name
        path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
