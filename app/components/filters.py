# app/components/filters.py
import streamlit as st
import pandas as pd
from pathlib import Path


@st.cache_data
def load_data() -> pd.DataFrame:
    """Load master dataset — cached for performance."""
    base = Path(__file__).resolve().parent.parent.parent
    path = base / "data" / "processed" / "jakarta_master.csv"
    df = pd.read_csv(path, parse_dates=["date"])
    df = df.set_index("date")
    return df


def sidebar_year_filter(df: pd.DataFrame,
                         default_start: int = 2019,
                         default_end: int = 2022) -> pd.DataFrame:
    """Reusable year range filter in sidebar."""
    st.sidebar.markdown("### 📅 Date Filter")
    years = sorted(df.index.year.unique())

    start_year = st.sidebar.selectbox(
        "Start Year", years,
        index=years.index(default_start)
    )
    end_year = st.sidebar.selectbox(
        "End Year", years,
        index=years.index(default_end)
    )

    if start_year > end_year:
        st.sidebar.error("Start year must be ≤ end year")
        return df

    return df[str(start_year):str(end_year)]


def who_guideline_note():
    """Reusable WHO guideline disclaimer."""
    st.caption(
        "🔴 WHO 24-hour PM2.5 guideline: **15 µg/m³** | "
        "WHO Annual guideline: **5 µg/m³**"
    )
