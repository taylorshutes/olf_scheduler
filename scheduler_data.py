"""
scheduler_data.py — converts database rows (vendors/schools/classes) into
the Vendor and SchoolClass objects the solver works with.

A class's arrival/departure times come from its parent school, since the
classes table doesn't store its own — every class in a school arrives
and leaves with that school.
"""

import vendors as vendor_db
import schools as school_db
import classes as class_db
from models import Vendor, SchoolClass, clock_to_minutes


def _split_tags(text):
    return [t.strip() for t in text.split(",") if t.strip()]


def _split_ages(text):
    """"8,9" -> [8, 9]. Empty string -> []."""
    return [int(a) for a in text.split(",") if a.strip()]


def load_vendors():
    rows = vendor_db.get_vendors()
    columns = [
        "id", "name", "available_start", "available_end", "session_duration",
        "capacity_per_session", "tags", "workshop_type", "target_ages",
        "excluded_ages", "travel_time", "wants_break", "break_duration",
    ]
    result = []
    for row in rows:
        r = dict(zip(columns, row))
        result.append(Vendor(
            id=str(r["id"]),
            name=r["name"],
            available_start=clock_to_minutes(r["available_start"]),
            available_end=clock_to_minutes(r["available_end"]),
            session_duration=r["session_duration"],
            capacity_per_session=r["capacity_per_session"],
            tags=_split_tags(r["tags"]),
            workshop_type=r["workshop_type"],
            target_ages=_split_ages(r["target_ages"]),
            excluded_ages=_split_ages(r["excluded_ages"]),
            travel_time=r["travel_time"],
            wants_break=bool(r["wants_break"]),
            break_duration=r["break_duration"],
        ))
    return result


def load_classes():
    schools_by_id = {row[0]: row for row in school_db.get_schools()}  # id, name, arrival_time, departure_time

    result = []
    for row in class_db.get_classes():
        class_id, school_id, name, capacity, age_group, target_workshops = row
        school = schools_by_id.get(school_id)
        if school is None:
            raise ValueError(f"class {class_id} references missing school_id {school_id}")
        _, _, arrival_time, departure_time = school
        result.append(SchoolClass(
            id=str(class_id),
            school_id=str(school_id),
            capacity=capacity,
            age_group=_split_ages(age_group),
            arrival=clock_to_minutes(arrival_time),
            departure=clock_to_minutes(departure_time),
            target_workshops=target_workshops,
        ))
    return result
