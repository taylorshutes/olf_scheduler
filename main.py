"""
main.py — the API server. Run it with:

    uvicorn main:app --reload

Live at http://127.0.0.1:8000
Interactive docs (auto-generated, lets you try every endpoint in a
browser) at http://127.0.0.1:8000/docs

This step only wires up vendors. Schools and classes get added the
same way once this is proven to work.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from db import create_tables
import vendors as vendor_db

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