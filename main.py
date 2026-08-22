"""
main.py — the API server. Run it with:

    uvicorn main:app --reload

Live at http://127.0.0.1:8000
Interactive docs (auto-generated, lets you try every endpoint in a
browser) at http://127.0.0.1:8000/docs
"""

import sqlite3
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from db import create_tables
import vendors as vendor_db
import schools as school_db
import classes as class_db

app = FastAPI(title="Excursion Scheduler API")

create_tables()  # make sure tables exist as soon as the server starts


class VendorIn(BaseModel):
    name: str
    available_start: str    # "HH:MM"
    available_end: str      # "HH:MM"
    session_duration: int
    capacity_per_session: int
    tags: str = ""
    workshop_type: str = ""
    target_ages: str = ""
    excluded_ages: str = ""
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
    return [dict(zip(columns, row)) for row in rows]


@app.post("/vendors")
def create_vendor(vendor: VendorIn):
    new_id = vendor_db.add_vendor(**vendor.model_dump())
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
    age_group: str


@app.get("/classes")
def list_classes(school_id: Optional[int] = None):
    rows = class_db.get_classes(school_id=school_id)
    columns = ["id", "school_id", "name", "capacity", "age_group"]
    return [dict(zip(columns, row)) for row in rows]


@app.post("/classes")
def create_class(class_: ClassIn):
    try:
        new_id = class_db.add_class(**class_.model_dump())
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