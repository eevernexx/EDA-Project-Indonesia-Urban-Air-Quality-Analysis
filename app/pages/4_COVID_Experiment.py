# app/pages/4_COVID_Experiment.py
import streamlit as st
import plotly.graph_objects as go
import pandas as pd
import numpy as np
import statsmodels.formula.api as smf
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from app.components.filters import load_data, who_guideline_note

st.set_page_config(page_title="COVID Experiment", page_icon="🦠", layout="wide")

st.title("🦠 COVID-19 as a Natural Experiment")
st.markdown("""
> **Research Question:** Did Jakarta's PSBB (lockdown) improve air quality,
> after controlling for weather and seasonality?
""")

# Load & prep
df = load_data()
covid_df = df["2019":"2021"].copy().reset_index()

PSBB_START      = pd.Timestamp("2020-04-10")
PSBB_END_STRICT = pd.Timestamp("2020-06-04")
PSBB_END_ALL    = pd.Timestamp("2020-10-11")

covid_df["T"]        = (covid_df["date"] - covid_df["date"].min()).dt.days
covid_df["D"]        = (covid_df["date"] >= PSBB_START).astype(int)
covid_df["P"]        = np.where(
    covid_df["date"] >= PSBB_START,
    (covid_df["date"] - PSBB_START).dt.days, 0
)
covid_df["log_pm25"] = np.log(covid_df["pm25_mean"])
covid_df["month"]    = covid_df["date"].dt.month

# ── Section 1: The Puzzle ─────────────────────────────────
st.markdown("---")
st.subheader("1. The Puzzle: Did Lockdown Help?")

col1, col2, col3 = st.columns(3)

pre    = covid_df[covid_df["date"] < PSBB_START]["pm25_mean"].dropna()
during = covid_df[
    (covid_df["date"] >= PSBB_START) &
    (covid_df["date"] <= PSBB_END_STRICT)
]["pm25_mean"].dropna()
post   = covid_df[covid_df["date"] > PSBB_END_ALL]["pm25_mean"].dropna()

with col1:
    st.metric("Pre-PSBB Mean", f"{pre.mean():.1f} µg/m³", "Jan 2019 – Apr 2020")
with col2:
    naive = (during.mean() - pre.mean()) / pre.mean() * 100
    st.metric("During PSBB Mean", f"{during.mean():.1f} µg/m³",
              f"{naive:+.1f}% naive change", delta_color="inverse")
with col3:
    st.metric("Post-PSBB Mean", f"{post.mean():.1f} µg/m³", "Oct 2020 – Dec 2021")

st.warning(
    "⚠️ **The naive comparison shows almost no change (-0.1%).** "
    "But this ignores weather confounders. "
    "We need a statistical model to isolate the PSBB effect."
)

# ── Section 2: ITS Model ──────────────────────────────────
st.markdown("---")
st.subheader("2. Interrupted Time Series Model")

st.markdown("""
**Model:** `log(PM2.5) = β₀ + β₁·Time + β₂·PSBB + β₃·Time×PSBB + γ·Weather + δ·Month + ε`

- **β₂** = immediate level change when PSBB started
- **β₃** = slope change during PSBB
- **γ** = weather controls (wind, rain, humidity, temperature)
- **δ** = seasonal controls (month fixed effects)
- Standard errors: HAC (Newey-West, 14-day lag)
""")


@st.cache_data
def fit_its_model(data: pd.DataFrame):
    model_data = data.dropna(subset=[
        "log_pm25", "temp_mean", "precipitation",
        "windspeed_max", "humidity_mean"
    ]).copy()
    dummies    = pd.get_dummies(model_data["month"], prefix="m", drop_first=True, dtype=int)
    model_data = pd.concat([model_data, dummies], axis=1)
    month_cols = [c for c in model_data.columns if c.startswith("m_")]
    weather    = "temp_mean + precipitation + windspeed_max + humidity_mean"
    months     = " + ".join(month_cols)
    formula    = f"log_pm25 ~ T + D + P + {weather} + {months}"
    model      = smf.ols(formula=formula, data=model_data).fit(
        cov_type="HAC", cov_kwds={"maxlags": 14}
    )
    return model, model_data


model, model_data = fit_its_model(covid_df)

D_coef     = model.params["D"]
D_pval     = model.pvalues["D"]
D_ci       = model.conf_int().loc["D"]
effect_pct = (np.exp(D_coef) - 1) * 100
ci_lo      = (np.exp(D_ci[0]) - 1) * 100
ci_hi      = (np.exp(D_ci[1]) - 1) * 100

col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Weather-Adjusted Effect", f"{effect_pct:.1f}%", "PM2.5 change during PSBB")
with col2:
    st.metric("95% Confidence Interval", f"{ci_lo:.1f}% to {ci_hi:.1f}%")
with col3:
    st.metric("p-value", f"{D_pval:.4f}",
              "Statistically significant" if D_pval < 0.05 else "Not significant")

if D_pval < 0.05:
    st.success(
        f"✅ **PSBB was associated with a statistically significant {abs(effect_pct):.1f}% "
        f"reduction in PM2.5** (95%CI: {ci_lo:.1f}% to {ci_hi:.1f}%), "
        f"after controlling for weather and seasonality (p={D_pval:.4f})."
    )

# ── Section 3: Counterfactual Chart ──────────────────────
st.markdown("---")
st.subheader("3. Observed vs Counterfactual")

model_data_cf        = model_data.copy()
model_data_cf["D"]   = 0
model_data_cf["P"]   = 0

model_data = model_data.copy()
model_data["predicted"]      = np.exp(model.predict(model_data))
model_data["counterfactual"] = np.exp(model.predict(model_data_cf))

fig = go.Figure()
fig.add_trace(go.Scatter(
    x=model_data["date"], y=model_data["pm25_mean"],
    mode="lines", name="Observed PM2.5",
    line=dict(color="lightsteelblue", width=1), opacity=0.6,
))
fig.add_trace(go.Scatter(
    x=model_data["date"], y=model_data["predicted"],
    mode="lines", name="Model Fitted",
    line=dict(color="#2c3e50", width=2),
))
fig.add_trace(go.Scatter(
    x=model_data["date"], y=model_data["counterfactual"],
    mode="lines", name="Counterfactual (without PSBB)",
    line=dict(color="#e74c3c", width=2, dash="dash"),
))
fig.add_vrect(
    x0="2020-04-10", x1="2020-06-04",
    fillcolor="rgba(231,76,60,0.12)", layer="below", line_width=0,
    annotation_text="PSBB Strict", annotation_position="top left",
)
fig.add_vrect(
    x0="2020-06-05", x1="2020-10-11",
    fillcolor="rgba(243,156,18,0.10)", layer="below", line_width=0,
    annotation_text="PSBB Transition", annotation_position="top left",
)
fig.update_layout(
    title="Jakarta PM2.5: Observed vs Counterfactual (ITS Model)",
    xaxis_title="Date", yaxis_title="PM2.5 (µg/m³)",
    template="plotly_white", height=500,
    legend=dict(x=0.01, y=0.99),
)
st.plotly_chart(fig, use_container_width=True)
st.caption(
    "**Red dashed line** = what PM2.5 would have been without PSBB, "
    "based on pre-PSBB trend + weather conditions."
)

# ── Section 4: Limitations ────────────────────────────────
st.markdown("---")
st.subheader("4. Limitations & Caveats")

st.markdown("""
| Limitation | Details |
|---|---|
| **Single station** | Jakarta Central only — may not represent all of Jakarta |
| **Borderline CI** | 95%CI lower bound near zero — interpret cautiously |
| **Residual autocorrelation** | DW≈1.40, partially addressed by HAC standard errors |
| **No control city** | Cannot rule out concurrent national-level factors |
| **PSBB compliance** | Actual mobility reduction not measured directly |
| **Sensor gaps** | 19.9% missing days in 2020 — particularly October |

> This analysis provides **suggestive evidence** of a PSBB effect.
> Causal claims require stronger identification strategies (e.g., synthetic control).
""")

who_guideline_note()
