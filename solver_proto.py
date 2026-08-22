"""
Excursion Workshop Scheduler — CP-SAT solver prototype
=========================================================

Uses Google OR-Tools CP-SAT to auto-assign school classes to vendor
workshop sessions across a single excursion day, respecting hard rules
(age suitability, time windows, no double-booking, no vendor repeats,
mandatory recess/lunch) and soft rules (avoid capacity overflow, avoid
back-to-back same-tag workshops) via a weighted objective.

This is a STANDALONE PROTOTYPE with fake data, meant to validate the
modelling approach before wiring it up to a real front end / JSON data.
Times are minutes-from-midnight ints (9:00am = 540) to keep the model simple.
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
    tags: list                    # content tags, e.g. ["science", "hands-on"]
    workshop_type: str            # "lecture" / "interactive" / "art"
    target_ages: list = field(default_factory=list)   # empty = no restriction
    excluded_ages: list = field(default_factory=list)
    travel_time: int = 0          # minutes to reach this vendor's location
    wants_break: bool = True
    break_duration: int = 10

    def sessions(self):
        """Generate fixed (start, end) session slots across the vendor's window."""
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
    target_workshops: int = 3     # how many workshops we'd LIKE this class to attend


# ---------------------------------------------------------------------------
# Fake data
# ---------------------------------------------------------------------------

DAY_START = 540   # 9:00am
DAY_END = 900      # 3:00pm
RECESS_WINDOW = (600, 660)   # 10:00-11:00, class picks a 15min slot inside
RECESS_DURATION = 15
LUNCH_WINDOW = (690, 780)    # 11:30-1:00pm, class picks a 30min slot inside
LUNCH_DURATION = 30

vendors = [
    Vendor("v1", "Robotics Lab", 540, 870, 45, 30,
           tags=["stem", "hands-on"], workshop_type="interactive",
           target_ages=["upper-primary", "secondary"]),
    Vendor("v2", "Bushcraft Basics", 540, 840, 40, 25,
           tags=["outdoors", "hands-on"], workshop_type="interactive",
           excluded_ages=["infants"]),
    Vendor("v3", "Local History Talk", 540, 780, 30, 60,
           tags=["history", "talk"], workshop_type="lecture",
           travel_time=10),
    Vendor("v4", "Pottery Studio", 540, 810, 50, 15,
           tags=["art", "hands-on"], workshop_type="art",
           target_ages=["lower-primary", "upper-primary"]),
    Vendor("v5", "Astronomy Show", 600, 870, 35, 80,
           tags=["stem", "talk"], workshop_type="lecture"),
    Vendor("v6", "Drama Workshop", 540, 840, 45, 20,
           tags=["art", "performance"], workshop_type="interactive"),
]

classes = [
    SchoolClass("c1", "school-a", 24, "upper-primary", DAY_START, DAY_END),
    SchoolClass("c2", "school-a", 22, "upper-primary", DAY_START, DAY_END),
    SchoolClass("c3", "school-a", 20, "lower-primary", DAY_START, DAY_END),
    SchoolClass("c4", "school-b", 26, "secondary", DAY_START, DAY_END),
    SchoolClass("c5", "school-b", 18, "secondary", DAY_START, DAY_END),
]

# soft-rule weights (tune later)
W_OVERFLOW = 50        # penalty per kid over capacity
W_TAG_REPEAT = 8        # penalty for two same-tag workshops back-to-back
W_ASSIGNMENT = 10       # reward per workshop successfully attended
MAX_OVERFLOW_FRAC = 0.15   # allow up to 15% over capacity before it's disallowed entirely


# ---------------------------------------------------------------------------
# Build model
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


def build_and_solve(vendors, classes):
    model = cp_model.CpModel()

    # candidate[(class_id, vendor_id, session_idx)] -> BoolVar
    candidates = {}
    # per-class list of (start, end, var, tags) for NoOverlap + adjacency checks
    class_intervals = {c.id: [] for c in classes}
    # per (vendor_id, session_idx): list of (class, var) for capacity constraint
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

    # --- Hard: a class doesn't attend the same vendor twice ---
    for c in classes:
        for v in vendors:
            vars_for_vendor = [
                var for (cid, vid, s_idx), var in candidates.items()
                if cid == c.id and vid == v.id
            ]
            if len(vars_for_vendor) > 1:
                model.Add(sum(vars_for_vendor) <= 1)

    # --- Hard: recess + lunch intervals per class (mandatory, flexible start) ---
    recess_vars = {}
    lunch_vars = {}
    for c in classes:
        r_start = model.NewIntVar(RECESS_WINDOW[0], RECESS_WINDOW[1] - RECESS_DURATION, f"recess_start_{c.id}")
        r_interval = model.NewFixedSizeIntervalVar(r_start, RECESS_DURATION, f"recess_iv_{c.id}")
        recess_vars[c.id] = r_start

        l_start = model.NewIntVar(LUNCH_WINDOW[0], LUNCH_WINDOW[1] - LUNCH_DURATION, f"lunch_start_{c.id}")
        l_interval = model.NewFixedSizeIntervalVar(l_start, LUNCH_DURATION, f"lunch_iv_{c.id}")
        lunch_vars[c.id] = l_start

        all_intervals = [ci["interval"] for ci in class_intervals[c.id]] + [r_interval, l_interval]
        model.AddNoOverlap(all_intervals)

    # --- Soft (capped): vendor session capacity, with bounded overflow ---
    overflow_vars = []
    for (vid, s_idx), loads in session_loads.items():
        if not loads:
            continue
        vendor = next(v for v in vendors if v.id == vid)
        cap = vendor.capacity_per_session
        max_cap = int(cap * (1 + MAX_OVERFLOW_FRAC))
        total = sum(c.capacity * var for c, var in loads)
        overflow = model.NewIntVar(0, max_cap - cap, f"overflow_{vid}_{s_idx}")
        model.Add(total <= cap + overflow)
        model.Add(total <= max_cap)  # hard ceiling even with overflow allowed
        overflow_vars.append(overflow)

    # --- Soft: penalize back-to-back same-tag workshops for the same class ---
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

    # --- Objective ---
    # Built as a flat list of weighted terms (rather than combining sum()/+/- directly)
    # since OR-Tools' operator overloading for LinearExpr can be version-sensitive.
    objective_terms = []
    for var in candidates.values():
        objective_terms.append(var * W_ASSIGNMENT)
    for var in overflow_vars:
        objective_terms.append(var * (-W_OVERFLOW))
    for var in repeat_penalty_vars:
        objective_terms.append(var * (-W_TAG_REPEAT))
    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    return status, solver, candidates, overflow_vars, session_loads, recess_vars, lunch_vars


def minutes_to_clock(m):
    h, mm = divmod(m, 60)
    return f"{h:02d}:{mm:02d}"


def report(status, solver, candidates, overflow_vars, session_loads, recess_vars, lunch_vars):
    print("Status:", solver.StatusName(status))
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        print("No feasible schedule found.")
        return

    print(f"Objective value: {solver.ObjectiveValue()}\n")

    by_class = {}
    for (cid, vid, s_idx), var in candidates.items():
        if solver.Value(var):
            by_class.setdefault(cid, []).append((vid, s_idx))

    for c in classes:
        print(f"--- {c.id} ({c.age_group}, {c.capacity} kids) ---")
        entries = []
        entries.append((solver.Value(recess_vars[c.id]), "RECESS", RECESS_DURATION))
        entries.append((solver.Value(lunch_vars[c.id]), "LUNCH", LUNCH_DURATION))
        for vid, s_idx in by_class.get(c.id, []):
            v = next(v for v in vendors if v.id == vid)
            start, end = v.sessions()[s_idx]
            entries.append((start, v.name, end - start))
        entries.sort(key=lambda x: x[0])
        for start, label, dur in entries:
            print(f"  {minutes_to_clock(start)}–{minutes_to_clock(start + dur)}  {label}")
        n = len(by_class.get(c.id, []))
        flag = "  (target not met)" if n < c.target_workshops else ""
        print(f"  -> {n}/{c.target_workshops} workshops attended{flag}\n")

    print("--- Capacity alerts ---")
    any_overflow = False
    for (vid, s_idx), loads in session_loads.items():
        total = sum(c.capacity for c, var in loads if solver.Value(var))
        vendor = next(v for v in vendors if v.id == vid)
        if total > vendor.capacity_per_session:
            any_overflow = True
            print(f"  {vendor.name} session {s_idx}: {total}/{vendor.capacity_per_session} "
                  f"kids (+{total - vendor.capacity_per_session} over)")
    if not any_overflow:
        print("  None — all sessions within capacity.")


if __name__ == "__main__":
    status, solver, candidates, overflow_vars, session_loads, recess_vars, lunch_vars = build_and_solve(vendors, classes)
    report(status, solver, candidates, overflow_vars, session_loads, recess_vars, lunch_vars)