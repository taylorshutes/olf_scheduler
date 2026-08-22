"""
main.py — the API server. Run it with:

    uvicorn main:app --reload

Live at http://127.0.0.1:8000
Interactive docs (auto-generated, lets you try every endpoint in a
browser) at http://127.0.0.1:8000/docs
"""

import sqlite3
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from db import create_tables
import vendors as vendor_db
import schools as school_db
import classes as class_db
import scheduler_data
from models import minutes_to_clock
from solver import build_and_solve, extract_schedule

app = FastAPI(title="Excursion Scheduler API")

create_tables()  # make sure tables exist as soon as the server starts


def _ages_to_text(ages):
    """[8, 9] -> "8,9" for storage in a comma-separated TEXT column."""
    return ",".join(str(a) for a in ages)


def _text_to_ages(text):
    """"8,9" -> [8, 9]. Empty string -> []."""
    return [int(a) for a in text.split(",") if a.strip()]


class VendorIn(BaseModel):
    name: str
    available_start: str    # "HH:MM"
    available_end: str      # "HH:MM"
    session_duration: int
    capacity_per_session: int
    tags: str = ""
    workshop_type: str = ""
    target_ages: List[int] = []   # school years, e.g. [8, 9]; empty = no restriction
    excluded_ages: List[int] = []
    travel_time: int = 0
    wants_break: bool = True
    break_duration: int = 10


@app.get("/vendors")
def list_vendors():
    rows = vendor_db.get_vendors()
    columns = [
        "id", "name", "available_start", "available_end", "session_duration",
        "capacity_per_session", "tags", "workshop_type", "target_ages",
        "excluded_ages", "travel_time", "wants_break", "break_duration",
    ]
    result = []
    for row in rows:
        v = dict(zip(columns, row))
        v["target_ages"] = _text_to_ages(v["target_ages"])
        v["excluded_ages"] = _text_to_ages(v["excluded_ages"])
        result.append(v)
    return result


@app.post("/vendors")
def create_vendor(vendor: VendorIn):
    data = vendor.model_dump()
    data["target_ages"] = _ages_to_text(data["target_ages"])
    data["excluded_ages"] = _ages_to_text(data["excluded_ages"])
    new_id = vendor_db.add_vendor(**data)
    return {"id": new_id, **vendor.model_dump()}


@app.delete("/vendors/{vendor_id}")
def remove_vendor(vendor_id: int):
    existing_ids = [row[0] for row in vendor_db.get_vendors()]
    if vendor_id not in existing_ids:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor_db.delete_vendor(vendor_id)
    return {"deleted": vendor_id}


class SchoolIn(BaseModel):
    name: str
    arrival_time: str    # "HH:MM"
    departure_time: str  # "HH:MM"


@app.get("/schools")
def list_schools():
    rows = school_db.get_schools()
    columns = ["id", "name", "arrival_time", "departure_time"]
    return [dict(zip(columns, row)) for row in rows]


@app.post("/schools")
def create_school(school: SchoolIn):
    new_id = school_db.add_school(**school.model_dump())
    return {"id": new_id, **school.model_dump()}


@app.delete("/schools/{school_id}")
def remove_school(school_id: int):
    existing_ids = [row[0] for row in school_db.get_schools()]
    if school_id not in existing_ids:
        raise HTTPException(status_code=404, detail="School not found")
    school_db.delete_school(school_id)
    return {"deleted": school_id}


class ClassIn(BaseModel):
    school_id: int
    name: str
    capacity: int
    age_group: List[int]   # school years, e.g. [8, 9] for a combined class
    target_workshops: int = 1


@app.get("/classes")
def list_classes(school_id: Optional[int] = None):
    rows = class_db.get_classes(school_id=school_id)
    columns = ["id", "school_id", "name", "capacity", "age_group", "target_workshops"]
    result = []
    for row in rows:
        c = dict(zip(columns, row))
        c["age_group"] = _text_to_ages(c["age_group"])
        result.append(c)
    return result


@app.post("/classes")
def create_class(class_: ClassIn):
    data = class_.model_dump()
    data["age_group"] = _ages_to_text(data["age_group"])
    try:
        new_id = class_db.add_class(**data)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="school_id does not exist")
    return {"id": new_id, **class_.model_dump()}


@app.delete("/classes/{class_id}")
def remove_class(class_id: int):
    existing_ids = [row[0] for row in class_db.get_classes()]
    if class_id not in existing_ids:
        raise HTTPException(status_code=404, detail="Class not found")
    class_db.delete_class(class_id)
    return {"deleted": class_id}


@app.post("/solve")
def solve():
    vendors = scheduler_data.load_vendors()
    classes = scheduler_data.load_classes()
    if not vendors or not classes:
        raise HTTPException(status_code=400, detail="Need at least one vendor and one class to solve")

    result = build_and_solve(vendors, classes)
    by_class, alerts = extract_schedule(result, vendors, classes)
    if by_class is None:
        raise HTTPException(status_code=422, detail="Solver could not find a feasible schedule")

    schedule = {
        class_id: [
            {"start": minutes_to_clock(start), "end": minutes_to_clock(end), "label": label, "kind": kind}
            for start, end, label, kind in entries
        ]
        for class_id, entries in by_class.items()
    }
    return {"schedule": schedule, "alerts": alerts}