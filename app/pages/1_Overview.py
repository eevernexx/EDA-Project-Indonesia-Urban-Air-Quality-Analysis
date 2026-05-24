# app/pages/1_Overview.py
import streamlit as st
import plotly.graph_objects as go
import pandas as pd
import numpy as np
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from app.components.filters import load_data, who_guideline_note

st.set_page_config(page_title="Overview", page_icon="📊", layout="wide")
st.title("📊 Overview")
st.markdown("Annual PM2.5 statistics and key metrics for Jakarta (2019–2022)")

# Load data
df = load_data()
df_valid = df["2019":"2022"].dropna(subset=["pm25_mean"])

# ── KPI Metrics ──────────────────────────────────────────
WHO_ANNUAL = 5.0
WHO_24H = 15.0

overall_mean = df_valid["pm25_mean"].mean()
pct_exceed = (df_valid["pm25_mean"] > WHO_24H).mean() * 100
worst_day = df_valid["pm25_mean"].max()
worst_date = df_valid["pm25_mean"].idxmax().strftime("%d %b %Y")

annual_means = df_valid.groupby("year")["pm25_mean"].mean()

col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric(
        "Overall Mean PM2.5",
        f"{overall_mean:.1f} µg/m³",
        f"{overall_mean/WHO_ANNUAL:.1f}x WHO Annual Guideline",
        delta_color="inverse",
    )
with col2:
    st.metric(
        "Days Exceeding WHO 24h",
        f"{pct_exceed:.1f}%",
        "of all valid days",
        delta_color="inverse",
    )
with col3:
    st.metric(
        "Worst Day Recorded",
        f"{worst_day:.0f} µg/m³",
        worst_date,
        delta_color="inverse",
    )
with col4:
    st.metric(
        "Best Annual Mean",
        f"{annual_means.min():.1f} µg/m³",
        f"Year {annual_means.idxmin()}",
    )

who_guideline_note()
st.markdown("---")

# ── Annual Bar Chart ──────────────────────────────────────
st.subheader("Annual Mean PM2.5")

annual = df_valid.groupby("year")["pm25_mean"].agg(["mean", "std"]).reset_index()

fig = go.Figure()
fig.add_trace(go.Bar(
    x=annual["year"],
    y=annual["mean"],
    error_y=dict(type="data", array=annual["std"], visible=True),
    marker_color=["#e74c3c" if v > 35 else "#f39c12" if v > 25 else "#27ae60"
                  for v in annual["mean"]],
    text=annual["mean"].round(1),
    textposition="outside",
    name="Annual Mean PM2.5",
))
fig.add_hline(
    y=WHO_ANNUAL, line_dash="dash", line_color="red",
    annotation_text="WHO Annual Guideline (5 µg/m³)",
)
fig.add_hline(
    y=35, line_dash="dot", line_color="orange",
    annotation_text="Indonesia ISPU Threshold (35 µg/m³)",
)
fig.update_layout(
    xaxis_title="Year",
    yaxis_title="PM2.5 (µg/m³)",
    template="plotly_white",
    height=400,
    showlegend=False,
)
st.plotly_chart(fig, use_container_width=True)

# ── Year-by-year detail table ─────────────────────────────
st.subheader("Year-by-Year Statistics")

annual_table = df_valid.groupby("year")["pm25_mean"].agg([
    "count", "mean", "median", "std",
    lambda x: x.quantile(0.25),
    lambda x: x.quantile(0.75),
    lambda x: (x > WHO_24H).mean() * 100,
]).round(2)
annual_table.columns = [
    "Valid Days", "Mean", "Median", "Std Dev",
    "Q25", "Q75", "% Days > WHO 24h"
]
annual_table.index.name = "Year"

st.dataframe(
    annual_table.style.background_gradient(
        subset=["Mean"], cmap="RdYlGn_r"
    ).format("{:.1f}"),
    use_container_width=True,
)
