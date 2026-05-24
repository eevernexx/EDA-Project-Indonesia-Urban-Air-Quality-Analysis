# app/pages/2_Temporal_Trends.py
import streamlit as st
import plotly.graph_objects as go
import pandas as pd
import numpy as np
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from app.components.filters import load_data, sidebar_year_filter, who_guideline_note

st.set_page_config(page_title="Temporal Trends", page_icon="📈", layout="wide")
st.title("📈 Temporal Trends")
st.markdown("Daily PM2.5 time series with rolling averages and PSBB annotations")

df = load_data()
df = sidebar_year_filter(df, default_start=2019, default_end=2022)
df_valid = df.dropna(subset=["pm25_mean"])

WHO_24H = 15.0

# Rolling window selector
window = st.select_slider(
    "Rolling Average Window",
    options=[7, 14, 30, 60, 90],
    value=30,
    format_func=lambda x: f"{x}-day"
)

df["pm25_rolling"] = df["pm25_mean"].rolling(window, min_periods=window // 2).mean()

# ── Main time series ──────────────────────────────────────
fig = go.Figure()

fig.add_trace(go.Scatter(
    x=df.index, y=df["pm25_mean"],
    mode="lines", name="Daily PM2.5",
    line=dict(color="lightsteelblue", width=0.8),
    opacity=0.7,
))
fig.add_trace(go.Scatter(
    x=df.index, y=df["pm25_rolling"],
    mode="lines", name=f"{window}-Day Rolling Mean",
    line=dict(color="#2c3e50", width=2.5),
))
fig.add_hline(
    y=WHO_24H, line_dash="dash", line_color="red",
    annotation_text="WHO 24h (15 µg/m³)",
)

psbb_periods = [
    ("2020-04-10", "2020-06-04", "PSBB Strict",      "rgba(231,76,60,0.12)"),
    ("2020-06-05", "2020-09-13", "PSBB Transition",  "rgba(243,156,18,0.10)"),
    ("2020-09-14", "2020-10-11", "PSBB Strict 2",    "rgba(231,76,60,0.12)"),
]
for start, end, label, color in psbb_periods:
    if pd.Timestamp(start) >= df.index.min() and pd.Timestamp(start) <= df.index.max():
        fig.add_vrect(
            x0=start, x1=end,
            fillcolor=color, opacity=1,
            layer="below", line_width=0,
            annotation_text=label,
            annotation_position="top left",
        )

fig.update_layout(
    title="Jakarta PM2.5 Daily Time Series",
    xaxis_title="Date",
    yaxis_title="PM2.5 (µg/m³)",
    template="plotly_white",
    height=500,
    legend=dict(x=0.01, y=0.99),
)
st.plotly_chart(fig, use_container_width=True)
who_guideline_note()

# ── Monthly heatmap ───────────────────────────────────────
st.subheader("Monthly Heatmap")
month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

pivot = df_valid.groupby(["year", "month"])["pm25_mean"].mean().unstack()
pivot.columns = month_names[:len(pivot.columns)]

fig2 = go.Figure(go.Heatmap(
    z=pivot.values,
    x=pivot.columns,
    y=pivot.index,
    colorscale="RdYlGn_r",
    text=np.round(pivot.values, 1),
    texttemplate="%{text}",
    colorbar=dict(title="PM2.5<br>(µg/m³)"),
))
fig2.update_layout(
    title="Monthly Mean PM2.5 (µg/m³)",
    xaxis_title="Month",
    yaxis_title="Year",
    template="plotly_white",
    height=350,
)
st.plotly_chart(fig2, use_container_width=True)
