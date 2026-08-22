"""
vendors.py — CRUD for the vendors table. Nothing else lives here.

tags / target_ages / excluded_ages are stored as comma-separated text
(e.g. "stem,hands-on") to keep the schema simple — no separate tables
for them yet. Split on "," when you need them as a real list.
"""

from db import get_connection


def add_vendor(
    name,
    available_start,
    available_end,
    session_duration,
    capacity_per_session,
    tags="",
    workshop_type="",
    target_ages="",
    excluded_ages="",
    travel_time=0,
    wants_break=True,
    break_duration=10,
):
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO vendors (
                name, available_start, available_end, session_duration,
                capacity_per_session, tags, workshop_type, target_ages,
                excluded_ages, travel_time, wants_break, break_duration
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name, available_start, available_end, session_duration,
                capacity_per_session, tags, workshop_type, target_ages,
                excluded_ages, travel_time, int(wants_break), break_duration,
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_vendors():
    conn = get_connection()
    try:
        return conn.execute("""
            SELECT id, name, available_start, available_end, session_duration,
                   capacity_per_session, tags, workshop_type, target_ages,
                   excluded_ages, travel_time, wants_break, break_duration
            FROM vendors
        """).fetchall()
    finally:
        conn.close()


# Which fields can be updated. Keeps update_vendor() short instead of one
# big if/else pile for every column.
_UPDATABLE_FIELDS = {
    "name", "available_start", "available_end", "session_duration",
    "capacity_per_session", "tags", "workshop_type", "target_ages",
    "excluded_ages", "travel_time", "wants_break", "break_duration",
}


def update_vendor(vendor_id, **fields):
    """Update any subset of vendor fields, e.g:
        update_vendor(3, capacity_per_session=25, tags="stem,art")
    """
    unknown = set(fields) - _UPDATABLE_FIELDS
    if unknown:
        raise ValueError(f"Unknown vendor field(s): {unknown}")
    if not fields:
        return

    conn = get_connection()
    try:
        set_clause = ", ".join(f"{field} = ?" for field in fields)
        values = list(fields.values()) + [vendor_id]
        conn.execute(f"UPDATE vendors SET {set_clause} WHERE id = ?", values)
        conn.commit()
    finally:
        conn.close()


def delete_vendor(vendor_id):
    conn = get_connection()
    try:
        conn.execute("DELETE FROM vendors WHERE id = ?", (vendor_id,))
        conn.commit()
    finally:
        conn.close()