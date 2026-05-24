# app/streamlit_app.py
import streamlit as st

st.set_page_config(
    page_title="Jakarta Air Quality Dashboard",
    page_icon="🌫️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1a1a2e;
        margin-bottom: 0;
    }
    .sub-header {
        font-size: 1rem;
        color: #666;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: #f8f9fa;
        border-radius: 10px;
        padding: 1rem;
        border-left: 4px solid #e74c3c;
    }
    .stMetric label {
        font-size: 0.85rem !important;
        color: #666 !important;
    }
</style>
""", unsafe_allow_html=True)

st.markdown('<p class="main-header">🌫️ Jakarta Air Quality Dashboard</p>',
            unsafe_allow_html=True)
st.markdown('<p class="sub-header">PM2.5 Analysis 2019–2023 | Jakarta Central Station</p>',
            unsafe_allow_html=True)

st.markdown("---")

col1, col2, col3 = st.columns(3)

with col1:
    st.info("📊 **Navigate using the sidebar** to explore different analyses.")

with col2:
    st.warning("📈 **5 years** of daily PM2.5 data from Jakarta Central monitoring station.")

with col3:
    st.error("🦠 **COVID-19 natural experiment** — see how PSBB affected air quality.")

st.markdown("---")
st.markdown("""
### What you'll find here:
- **Temporal Trends** — Long-term PM2.5 patterns and annual statistics
- **Seasonal Analysis** — Wet vs dry season comparison
- **Weather Impact** — How rain, wind, and humidity affect air quality
- **COVID Experiment** — PSBB lockdown as a natural experiment

> **Data source:** OpenAQ API (Jakarta Central, reference-grade monitor) + NASA POWER ERA5 weather reanalysis
""")
