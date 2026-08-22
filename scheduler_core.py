"""
scheduler_core.py
==================
Reusable CP-SAT scheduling engine for the excursion workshop scheduler.
No hardcoded data here — this module is imported by the Streamlit app
(app.py) and by any test/demo scripts. See solver_prototype.py for a
standalone runnable example with fake data.
"""

from dataclasses import dataclass, field
from ortools.sat.python import cp_model


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class Vendor:
    id: str
    name: str
    available_start: int          # minutes from midnight
    available_end: int
    session_duration: int         # minutes
    capacity_per_session: int
    tags: list = field(default_factory=list)
    workshop_type: str = "interactive"
    target_ages: list = field(default_factory=list)   # empty = no restriction
    excluded_ages: list = field(default_factory=list)
    travel_time: int = 0
    wants_break: bool = True
    break_duration: int = 10

    def sessions(self):
        step = self.session_duration + (self.break_duration if self.wants_break else 0)
        slots = []
        t = self.available_start
        while t + self.session_duration <= self.available_end:
            slots.append((t, t + self.session_duration))
            t += step
        return slots


@dataclass
class SchoolClass:
    id: str
    school_id: str
    capacity: int
    age_group: str
    arrival: int
    departure: int
    target_workshops: int = 3


# ---------------------------------------------------------------------------
# Time helpers
# ---------------------------------------------------------------------------

def minutes_to_clock(m: int) -> str:
    h, mm = divmod(int(m), 60)
    return f"{h:02d}:{mm:02d}"


def clock_to_minutes(s: str) -> int:
    h, m = s.strip().split(":")
    return int(h) * 60 + int(m)


# ---------------------------------------------------------------------------
# Solver
# ---------------------------------------------------------------------------

def eligible(cls: SchoolClass, vendor: Vendor, session):
    start, end = session
    if vendor.target_ages and cls.age_group not in vendor.target_ages:
        return False
    if cls.age_group in vendor.excluded_ages:
        return False
    if start < cls.arrival or end > cls.departure:
        return False
    return True


def build_and_solve(
    vendors,
    classes,
    recess_window=(600, 660),
    recess_duration=15,
    lunch_window=(690, 780),
    lunch_duration=30,
    w_overflow=50,
    w_tag_repeat=8,
    w_assignment=10,
    max_overflow_frac=0.15,
    max_time_in_seconds=15,
):
    model = cp_model.CpModel()

    candidates = {}
    class_intervals = {c.id: [] for c in classes}
    session_loads = {}

    for v in vendors:
        for s_idx, (start, end) in enumerate(v.sessions()):
            session_loads[(v.id, s_idx)] = []
            for c in classes:
                if not eligible(c, v, (start, end)):
                    continue
                var = model.NewBoolVar(f"assign_{c.id}_{v.id}_{s_idx}")
                candidates[(c.id, v.id, s_idx)] = var
                interval = model.NewOptionalIntervalVar(
                    start, end - start, end, var, f"iv_{c.id}_{v.id}_{s_idx}"
                )
                class_intervals[c.id].append(
                    dict(start=start, end=end, var=var, tags=v.tags, vendor=v.id, interval=interval)
                )
                session_loads[(v.id, s_idx)].append((c, var))

    # Hard: no repeated vendor for the same class
    for c in classes:
        for v in vendors:
            vars_for_vendor = [
                var for (cid, vid, s_idx), var in candidates.items()
                if cid == c.id and vid == v.id
            ]
            if len(vars_for_vendor) > 1:
                model.Add(sum(vars_for_vendor) <= 1)

    # Hard: mandatory recess + lunch, flexible start within window, no overlap with workshops
    recess_vars = {}
    lunch_vars = {}
    for c in classes:
        r_start = model.NewIntVar(recess_window[0], recess_window[1] - recess_duration, f"recess_start_{c.id}")
        r_interval = model.NewFixedSizeIntervalVar(r_start, recess_duration, f"recess_iv_{c.id}")
        recess_vars[c.id] = r_start

        l_start = model.NewIntVar(lunch_window[0], lunch_window[1] - lunch_duration, f"lunch_start_{c.id}")
        l_interval = model.NewFixedSizeIntervalVar(l_start, lunch_duration, f"lunch_iv_{c.id}")
        lunch_vars[c.id] = l_start

        all_intervals = [ci["interval"] for ci in class_intervals[c.id]] + [r_interval, l_interval]
        model.AddNoOverlap(all_intervals)

    # Soft (capped): vendor capacity with bounded overflow
    overflow_vars = []
    for (vid, s_idx), loads in session_loads.items():
        if not loads:
            continue
        vendor = next(v for v in vendors if v.id == vid)
        cap = vendor.capacity_per_session
        max_cap = int(cap * (1 + max_overflow_frac))
        total = sum(c.capacity * var for c, var in loads)
        overflow = model.NewIntVar(0, max(0, max_cap - cap), f"overflow_{vid}_{s_idx}")
        model.Add(total <= cap + overflow)
        model.Add(total <= max_cap)
        overflow_vars.append(overflow)

    # Soft: penalize back-to-back same-tag workshops for the same class
    repeat_penalty_vars = []
    for c in classes:
        ivs = class_intervals[c.id]
        for i, a in enumerate(ivs):
            for b in ivs[i + 1:]:
                if a["end"] == b["start"] or b["end"] == a["start"]:
                    shared_tags = set(a["tags"]) & set(b["tags"])
                    if shared_tags:
                        both = model.NewBoolVar(f"repeat_{c.id}_{a['vendor']}_{b['vendor']}")
                        model.AddMultiplicationEquality(both, [a["var"], b["var"]])
                        repeat_penalty_vars.append(both)

    # Objective — flat list of weighted terms (version-safe with OR-Tools operator overloading)
    objective_terms = []
    for var in candidates.values():
        objective_terms.append(var * w_assignment)
    for var in overflow_vars:
        objective_terms.append(var * (-w_overflow))
    for var in repeat_penalty_vars:
        objective_terms.append(var * (-w_tag_repeat))
    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_time_in_seconds
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    return dict(
        status=status,
        solver=solver,
        candidates=candidates,
        overflow_vars=overflow_vars,
        session_loads=session_loads,
        recess_vars=recess_vars,
        lunch_vars=lunch_vars,
    )


def extract_schedule(result, vendors, classes):
    """Turn a solved result into plain-Python structures the UI can render:
    { class_id: [ (start, end, label, kind) ... sorted ] }, and a list of
    capacity alert strings.
    """
    solver = result["solver"]
    status = result["status"]
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None, None

    vendors_by_id = {v.id: v for v in vendors}

    by_class = {c.id: [] for c in classes}
    for (cid, vid, s_idx), var in result["candidates"].items():
        if solver.Value(var):
            v = vendors_by_id[vid]
            start, end = v.sessions()[s_idx]
            by_class[cid].append((start, end, v.name, "workshop"))

    for c in classes:
        r_start = solver.Value(result["recess_vars"][c.id])
        by_class[c.id].append((r_start, r_start + 15, "Recess", "recess"))
        l_start = solver.Value(result["lunch_vars"][c.id])
        by_class[c.id].append((l_start, l_start + 30, "Lunch", "lunch"))
        by_class[c.id].sort(key=lambda x: x[0])

    alerts = []
    for (vid, s_idx), loads in result["session_loads"].items():
        total = sum(c.capacity for c, var in loads if solver.Value(var))
        vendor = vendors_by_id[vid]
        if total > vendor.capacity_per_session:
            alerts.append(
                f"{vendor.name} (session {s_idx + 1}): {total}/{vendor.capacity_per_session} "
                f"kids — {total - vendor.capacity_per_session} over capacity"
            )

    return by_class, alerts


# ---------------------------------------------------------------------------
# Combined grid view (vendors across the top, time down the side, colour-coded
# by class) — mirrors the "manual spreadsheet" style master schedule.
# ---------------------------------------------------------------------------

PALETTE = [
    "#F28C8C", "#F2C68C", "#F2EA8C", "#B7E28C", "#8CE2B0",
    "#8CDDE2", "#8CB0E2", "#A98CE2", "#E28CDD", "#E28CA9",
    "#D9A066", "#8CE2C6", "#C6E28C", "#8C9EE2", "#E2C68C",
    "#B98CE2", "#8CE28C", "#E28C8C", "#8CC6E2", "#E2A98C",
]


def assign_colors(classes):
    """Stable class_id -> hex color mapping, cycling the palette if needed."""
    color_map = {}
    for i, c in enumerate(classes):
        color_map[c.id] = PALETTE[i % len(PALETTE)]
    return color_map


def build_combined_grid(classes, by_class, vendors, step=5):
    """Bucket every class's schedule into a shared time grid.

    Returns None if there's nothing to show, otherwise a dict with:
      times: sorted list of minute marks
      vendor_names: ordered vendor names (grid columns)
      cell_text: {time: {vendor_name: [entries]}}
      break_text: {time: [entries]}   (recess/lunch, shown in its own column)
    """
    all_times = [t for c in classes for (start, end, _, _) in by_class.get(c.id, []) for t in (start, end)]
    if not all_times:
        return None

    t0, t1 = min(all_times), max(all_times)
    times = list(range(t0, t1, step))
    vendor_names = [v.name for v in vendors]

    cell_text = {t: {name: [] for name in vendor_names} for t in times}
    break_text = {t: [] for t in times}

    for c in classes:
        for start, end, label, kind in by_class.get(c.id, []):
            for t in times:
                if start <= t < end:
                    if kind == "workshop" and label in cell_text[t]:
                        cell_text[t][label].append(f"{c.id} ({c.capacity})")
                    elif kind in ("recess", "lunch"):
                        break_text[t].append(f"{c.id}: {label}")

    return dict(times=times, vendor_names=vendor_names, cell_text=cell_text, break_text=break_text)


def render_combined_grid_html(grid, color_map, row_height_px=20):
    """Render the combined grid as a self-contained scrollable HTML table."""
    times = grid["times"]
    vendor_names = grid["vendor_names"]

    header_cells = "".join(
        f"<th style='position:sticky; top:0; background:#f5f5f5; padding:3px 6px; "
        f"border:1px solid #ddd; white-space:nowrap; font-size:11px;'>{name}</th>"
        for name in vendor_names
    )
    html = [
        "<div style='overflow:auto; max-height:720px; border:1px solid #ccc; font-family:sans-serif;'>",
        "<table style='border-collapse:collapse; width:100%;'>",
        f"<tr><th style='position:sticky; top:0; left:0; background:#f5f5f5; padding:3px 6px; "
        f"border:1px solid #ddd; font-size:11px;'>Time</th>{header_cells}"
        f"<th style='position:sticky; top:0; background:#f5f5f5; padding:3px 6px; border:1px solid #ddd; font-size:11px;'>Break</th></tr>",
    ]

    for t in times:
        row = [
            f"<tr style='height:{row_height_px}px;'>"
            f"<td style='padding:2px 6px; border:1px solid #eee; font-weight:bold; "
            f"background:#fafafa; font-size:10px; white-space:nowrap;'>{minutes_to_clock(t)}</td>"
        ]
        for name in vendor_names:
            entries = grid["cell_text"][t][name]
            if entries:
                primary_id = entries[0].split()[0]
                color = color_map.get(primary_id, "#dddddd")
                text = " / ".join(entries)
            else:
                color, text = "#ffffff", ""
            row.append(
                f"<td style='padding:2px 6px; border:1px solid #eee; background:{color}; "
                f"font-size:10px; white-space:nowrap;'>{text}</td>"
            )
        entries = grid["break_text"][t]
        if entries:
            color, text_color, text = "#b23b3b", "#ffffff", ", ".join(entries)
        else:
            color, text_color, text = "#ffffff", "#000000", ""
        row.append(
            f"<td style='padding:2px 6px; border:1px solid #eee; background:{color}; "
            f"color:{text_color}; font-size:10px; white-space:nowrap;'>{text}</td></tr>"
        )
        html.append("".join(row))

    html.append("</table></div>")
    return "".join(html)