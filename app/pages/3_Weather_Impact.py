# app/pages/3_Weather_Impact.py
import streamlit as st
import plotly.graph_objects as go
import pandas as pd
from scipy import stats
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from app.components.filters import load_data, who_guideline_note

st.set_page_config(page_title="Weather Impact", page_icon="🌧️", layout="wide")
st.title("🌧️ Weather Impact on PM2.5")
st.markdown("How meteorological conditions drive Jakarta's air quality")

df = load_data()
df = df["2019":"2022"].dropna(subset=["pm25_mean"])

# ── Correlation summary ───────────────────────────────────
st.subheader("Spearman Correlation with PM2.5")

weather_vars = {
    "precipitation": "Precipitation (mm)",
    "humidity_mean": "Humidity (%)",
    "windspeed_max": "Wind Speed (km/h)",
    "temp_mean":     "Temperature (°C)",
}

corr_data = []
for var, label in weather_vars.items():
    rho, pval = stats.spearmanr(df["pm25_mean"], df[var], nan_policy="omit")
    corr_data.append({
        "Variable":    label,
        "Spearman rho": round(rho, 3),
        "p-value":     round(pval, 4),
        "Direction":   "↓ Reduces PM2.5" if rho < 0 else "↑ Increases PM2.5",
    })

corr_df = pd.DataFrame(corr_data).sort_values("Spearman rho")

fig_corr = go.Figure(go.Bar(
    x=corr_df["Spearman rho"],
    y=corr_df["Variable"],
    orientation="h",
    marker_color=["#27ae60" if v < 0 else "#e74c3c"
                  for v in corr_df["Spearman rho"]],
    text=corr_df["Spearman rho"].astype(str),
    textposition="outside",
))
fig_corr.add_vline(x=0, line_color="black", line_width=1)
fig_corr.update_layout(
    title="Spearman rho: Weather vs PM2.5",
    xaxis_title="Correlation Coefficient",
    template="plotly_white",
    height=300,
)
st.plotly_chart(fig_corr, use_container_width=True)
st.dataframe(corr_df, use_container_width=True, hide_index=True)

st.markdown("---")

# ── Season comparison ─────────────────────────────────────
st.subheader("Dry vs Wet Season")

col1, col2 = st.columns(2)

dry = df[df["season"] == "dry"]["pm25_mean"]
wet = df[df["season"] == "wet"]["pm25_mean"]

with col1:
    fig_box = go.Figure()
    fig_box.add_trace(go.Box(
        y=dry, name="Dry Season",
        marker_color="#e67e22", boxmean=True,
    ))
    fig_box.add_trace(go.Box(
        y=wet, name="Wet Season",
        marker_color="#2980b9", boxmean=True,
    ))
    fig_box.update_layout(
        title="PM2.5 Distribution by Season",
        yaxis_title="PM2.5 (µg/m³)",
        template="plotly_white",
        height=400,
    )
    st.plotly_chart(fig_box, use_container_width=True)

with col2:
    st.metric("Dry Season Mean", f"{dry.mean():.1f} µg/m³")
    st.metric("Wet Season Mean", f"{wet.mean():.1f} µg/m³")
    diff_pct = (dry.mean() - wet.mean()) / wet.mean() * 100
    st.metric("Difference", f"{diff_pct:.1f}% higher in dry season")

    _, pval = stats.mannwhitneyu(dry, wet, alternative="greater")
    if pval < 0.001:
        st.success("✅ Difference statistically significant (p<0.001)")
    else:
        st.warning(f"p-value: {pval:.4f}")

    st.markdown("""
    **Interpretation:**
    - Dry season (May–Oct): Less rainfall → less wet deposition
    - Biomass burning peaks during dry season
    - Lower wind speeds trap pollutants near surface
    """)

who_guideline_note()
