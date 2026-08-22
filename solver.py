"""
solver.py — CP-SAT scheduling engine for the excursion workshop
scheduler: builds and solves the class-to-vendor-session assignment
model, then extracts a plain-Python schedule from the solved result.

Hard rules: age suitability, time windows, no double-booking, no
repeated vendor for a class, mandatory recess/lunch.
Soft rules (weighted objective): maximise assignments, bounded vendor
capacity overflow, avoid back-to-back same-tag workshops.
"""

from ortools.sat.python import cp_model

from models import eligible


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
                # Reserve travel_time as a buffer before the session so NoOverlap
                # below leaves room to get there — start/end (used for display and
                # the back-to-back tag check) stay the actual session times.
                buffer_start = max(0, start - v.travel_time)
                interval = model.NewOptionalIntervalVar(
                    buffer_start, end - buffer_start, end, var, f"iv_{c.id}_{v.id}_{s_idx}"
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

    # Hard: every class must get at least its target_workshops count
    for c in classes:
        class_vars = [var for (cid, vid, s_idx), var in candidates.items() if cid == c.id]
        model.Add(sum(class_vars) >= c.target_workshops)

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
