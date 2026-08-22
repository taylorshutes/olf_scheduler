"""
classes.py — CRUD for the classes table. Nothing else lives here.

Every class must belong to a school (school_id), enforced by the
foreign key in db.py.
"""

from db import get_connection


def add_class(school_id, name, capacity, age_group):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO classes (school_id, name, capacity, age_group) VALUES (?, ?, ?, ?)",
        (school_id, name, capacity, age_group),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id


def get_classes(school_id=None):
    """If school_id is given, only return classes for that school."""
    conn = get_connection()
    if school_id is None:
        rows = conn.execute("SELECT id, school_id, name, capacity, age_group FROM classes").fetchall()
    else:
        rows = conn.execute(
            "SELECT id, school_id, name, capacity, age_group FROM classes WHERE school_id = ?",
            (school_id,),
        ).fetchall()
    conn.close()
    return rows


def update_class(class_id, name=None, capacity=None, age_group=None):
    conn = get_connection()
    if name is not None:
        conn.execute("UPDATE classes SET name = ? WHERE id = ?", (name, class_id))
    if capacity is not None:
        conn.execute("UPDATE classes SET capacity = ? WHERE id = ?", (capacity, class_id))
    if age_group is not None:
        conn.execute("UPDATE classes SET age_group = ? WHERE id = ?", (age_group, class_id))
    conn.commit()
    conn.close()


def delete_class(class_id):
    conn = get_connection()
    conn.execute("DELETE FROM classes WHERE id = ?", (class_id,))
    conn.commit()
    conn.close()