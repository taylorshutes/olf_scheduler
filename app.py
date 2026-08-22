"""
Excursion Workshop Scheduler — Streamlit front end
====================================================
Run with:
    pip install streamlit ortools pandas
    streamlit run app.py

Tabs:
  - Vendors: add/edit/delete workshop vendors
  - Schools & Classes: add/edit/delete schools and their classes
  - Generate & Review: run the solver, see each class's schedule + alerts
  - Save / Load: export/import all data as JSON
"""

import json
import pandas as pd
import streamlit as st

from scheduler_core import (
    Vendor, SchoolClass, build_and_solve, extract_schedule,
    minutes_to_clock, clock_to_minutes,
    assign_colors, build_combined_grid, render_combined_grid_html,
)

st.set_page_config(page_title="Excursion Scheduler", layout="wide")


# ---------------------------------------------------------------------------
# Session state init
# ---------------------------------------------------------------------------

def default_vendors_df():
    return pd.DataFrame([
        dict(id="v1", name="Robotics Lab", available_start="09:00", available_end="14:30",
             session_duration=45, capacity_per_session=30, tags="stem, hands-on",
             workshop_type="interactive", target_ages="upper-primary, secondary",
             excluded_ages="", travel_time=0, wants_break=True, break_duration=10),
        dict(id="v2", name="Local History Talk", available_start="09:00", available_end="13:00",
             session_duration=30, capacity_per_session=60, tags="history, talk",
             workshop_type="lecture", target_ages="", excluded_ages="",
             travel_time=10, wants_break=True, break_duration=10),
    ])


def default_classes_df():
    return pd.DataFrame([
        dict(id="c1", school_id="school-a", capacity=24, age_group="upper-primary",
             arrival="09:00", departure="15:00", target_workshops=3),
        dict(id="c2", school_id="school-a", capacity=20, age_group="lower-primary",
             arrival="09:00", departure="15:00", target_workshops=3),
    ])


if "vendors_df" not in st.session_state:
    st.session_state.vendors_df = default_vendors_df()
if "classes_df" not in st.session_state:
    st.session_state.classes_df = default_classes_df()
if "schedule_result" not in st.session_state:
    st.session_state.schedule_result = None


# ---------------------------------------------------------------------------
# Conversion helpers: dataframe rows <-> dataclasses
# ---------------------------------------------------------------------------

def split_list(s):
    if not s or (isinstance(s, float)):
        return []
    return [x.strip() for x in str(s).split(",") if x.strip()]


def vendors_from_df(df):
    vendors = []
    for _, row in df.iterrows():
        if not str(row.get("id", "")).strip():
            continue
        vendors.append(Vendor(
            id=str(row["id"]).strip(),
            name=str(row["name"]),
            available_start=clock_to_minutes(row["available_start"]),
            available_end=clock_to_minutes(row["available_end"]),
            session_duration=int(row["session_duration"]),
            capacity_per_session=int(row["capacity_per_session"]),
            tags=split_list(row.get("tags", "")),
            workshop_type=str(row.get("workshop_type", "interactive")),
            target_ages=split_list(row.get("target_ages", "")),
            excluded_ages=split_list(row.get("excluded_ages", "")),
            travel_time=int(row.get("travel_time", 0) or 0),
            wants_break=bool(row.get("wants_break", True)),
            break_duration=int(row.get("break_duration", 10) or 10),
        ))
    return vendors


def classes_from_df(df):
    classes = []
    for _, row in df.iterrows():
        if not str(row.get("id", "")).strip():
            continue
        classes.append(SchoolClass(
            id=str(row["id"]).strip(),
            school_id=str(row["school_id"]),
            capacity=int(row["capacity"]),
            age_group=str(row["age_group"]),
            arrival=clock_to_minutes(row["arrival"]),
            departure=clock_to_minutes(row["departure"]),
            target_workshops=int(row.get("target_workshops", 3) or 3),
        ))
    return classes


# ---------------------------------------------------------------------------
# Tabs
# ---------------------------------------------------------------------------

tab_vendors, tab_classes, tab_generate, tab_combined, tab_data = st.tabs(
    ["Vendors", "Schools & Classes", "Generate & Review", "Combined View", "Save / Load"]
)

with tab_vendors:
    st.subheader("Workshop Vendors")
    st.caption("tags / target_ages / excluded_ages are comma-separated. Times are HH:MM (24h).")
    st.session_state.vendors_df = st.data_editor(
        st.session_state.vendors_df,
        num_rows="dynamic",
        use_container_width=True,
        key="vendors_editor",
    )

with tab_classes:
    st.subheader("Classes")
    st.caption("Each class belongs to a school (school_id). Times are HH:MM (24h).")
    st.session_state.classes_df = st.data_editor(
        st.session_state.classes_df,
        num_rows="dynamic",
        use_container_width=True,
        key="classes_editor",
    )

with tab_generate:
    st.subheader("Generate Schedule")
    col1, col2, col3 = st.columns(3)
    with col1:
        w_assignment = st.number_input("Reward per workshop attended", value=10)
    with col2:
        w_overflow = st.number_input("Penalty per kid over capacity", value=50)
    with col3:
        w_tag_repeat = st.number_input("Penalty for back-to-back same-tag workshops", value=8)

    if st.button("Run solver", type="primary"):
        vendors = vendors_from_df(st.session_state.vendors_df)
        classes = classes_from_df(st.session_state.classes_df)
        if not vendors or not classes:
            st.error("Add at least one vendor and one class first.")
        else:
            with st.spinner("Solving..."):
                result = build_and_solve(
                    vendors, classes,
                    w_assignment=w_assignment, w_overflow=w_overflow, w_tag_repeat=w_tag_repeat,
                )
                by_class, alerts = extract_schedule(result, vendors, classes)
            st.session_state.schedule_result = (result, by_class, alerts, classes)

    if st.session_state.schedule_result:
        result, by_class, alerts, classes = st.session_state.schedule_result
        from ortools.sat.python import cp_model
        status_name = result["solver"].StatusName(result["status"])
        st.write(f"**Solver status:** {status_name}")

        if by_class is None:
            st.error("No feasible schedule found — try loosening constraints or check for impossible time windows.")
        else:
            if alerts:
                st.warning("**Capacity alerts:**\n\n" + "\n\n".join(f"- {a}" for a in alerts))
            else:
                st.success("No capacity alerts — all sessions within limits.")

            for c in classes:
                with st.expander(f"{c.id}  ({c.age_group}, {c.capacity} kids)", expanded=True):
                    rows = []
                    for start, end, label, kind in by_class[c.id]:
                        rows.append({
                            "Time": f"{minutes_to_clock(start)}–{minutes_to_clock(end)}",
                            "Activity": label,
                            "Type": kind,
                        })
                    st.table(pd.DataFrame(rows))
                    n_workshops = sum(1 for _, _, _, k in by_class[c.id] if k == "workshop")
                    if n_workshops < c.target_workshops:
                        st.caption(f"⚠️ {n_workshops}/{c.target_workshops} target workshops attended")
                    else:
                        st.caption(f"{n_workshops}/{c.target_workshops} target workshops attended")

with tab_combined:
    st.subheader("Combined Schedule — all classes, all vendors")
    if not st.session_state.schedule_result:
        st.info("Run the solver on the 'Generate & Review' tab first.")
    else:
        result, by_class, alerts, classes = st.session_state.schedule_result
        if by_class is None:
            st.error("No feasible schedule to display.")
        else:
            vendors = vendors_from_df(st.session_state.vendors_df)
            grid = build_combined_grid(classes, by_class, vendors, step=5)
            if grid is None:
                st.warning("Nothing to show yet.")
            else:
                color_map = assign_colors(classes)
                st.markdown(render_combined_grid_html(grid, color_map), unsafe_allow_html=True)

                st.write("**Legend**")
                legend_cols = st.columns(min(6, len(classes)) or 1)
                for i, c in enumerate(classes):
                    with legend_cols[i % len(legend_cols)]:
                        st.markdown(
                            f"<span style='display:inline-block; width:12px; height:12px; "
                            f"background:{color_map[c.id]}; margin-right:6px; border:1px solid #999;'></span>"
                            f"{c.id} — {c.age_group}, {c.capacity} kids",
                            unsafe_allow_html=True,
                        )

with tab_data:
    st.subheader("Save / Load data as JSON")
    col1, col2 = st.columns(2)

    with col1:
        st.write("**Download current data**")
        payload = {
            "vendors": st.session_state.vendors_df.to_dict(orient="records"),
            "classes": st.session_state.classes_df.to_dict(orient="records"),
        }
        st.download_button(
            "Download JSON",
            data=json.dumps(payload, indent=2),
            file_name="excursion_data.json",
            mime="application/json",
        )

    with col2:
        st.write("**Upload data**")
        uploaded = st.file_uploader("Choose a JSON file", type="json")
        if uploaded is not None:
            data = json.load(uploaded)
            st.session_state.vendors_df = pd.DataFrame(data.get("vendors", []))
            st.session_state.classes_df = pd.DataFrame(data.get("classes", []))
            st.session_state.schedule_result = None
            st.success("Loaded. Check the Vendors / Schools & Classes tabs.")
            st.rerun()