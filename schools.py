"""
schools.py — CRUD for the schools table. Nothing else lives here.
"""

from db import get_connection


def add_school(name, arrival_time, departure_time):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO schools (name, arrival_time, departure_time) VALUES (?, ?, ?)",
        (name, arrival_time, departure_time),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id


def get_schools():
    conn = get_connection()
    rows = conn.execute("SELECT id, name, arrival_time, departure_time FROM schools").fetchall()
    conn.close()
    return rows


def update_school(school_id, name=None, arrival_time=None, departure_time=None):
    conn = get_connection()
    if name is not None:
        conn.execute("UPDATE schools SET name = ? WHERE id = ?", (name, school_id))
    if arrival_time is not None:
        conn.execute("UPDATE schools SET arrival_time = ? WHERE id = ?", (arrival_time, school_id))
    if departure_time is not None:
        conn.execute("UPDATE schools SET departure_time = ? WHERE id = ?", (departure_time, school_id))
    conn.commit()
    conn.close()


def delete_school(school_id):
    conn = get_connection()
    conn.execute("DELETE FROM schools WHERE id = ?", (school_id,))
    conn.commit()
    conn.close()