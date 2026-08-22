"""
classes.py — CRUD for the classes table. Nothing else lives here.

Every class must belong to a school (school_id), enforced by the
foreign key in db.py.
"""

from db import get_connection


def add_class(school_id, name, capacity, age_group, target_workshops=1):
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO classes (school_id, name, capacity, age_group, target_workshops) VALUES (?, ?, ?, ?, ?)",
            (school_id, name, capacity, age_group, target_workshops),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_classes(school_id=None):
    """If school_id is given, only return classes for that school."""
    conn = get_connection()
    try:
        if school_id is None:
            return conn.execute(
                "SELECT id, school_id, name, capacity, age_group, target_workshops FROM classes"
            ).fetchall()
        return conn.execute(
            "SELECT id, school_id, name, capacity, age_group, target_workshops FROM classes WHERE school_id = ?",
            (school_id,),
        ).fetchall()
    finally:
        conn.close()


def update_class(class_id, name=None, capacity=None, age_group=None, target_workshops=None):
    conn = get_connection()
    try:
        if name is not None:
            conn.execute("UPDATE classes SET name = ? WHERE id = ?", (name, class_id))
        if capacity is not None:
            conn.execute("UPDATE classes SET capacity = ? WHERE id = ?", (capacity, class_id))
        if age_group is not None:
            conn.execute("UPDATE classes SET age_group = ? WHERE id = ?", (age_group, class_id))
        if target_workshops is not None:
            conn.execute("UPDATE classes SET target_workshops = ? WHERE id = ?", (target_workshops, class_id))
        conn.commit()
    finally:
        conn.close()


def delete_class(class_id):
    conn = get_connection()
    try:
        conn.execute("DELETE FROM classes WHERE id = ?", (class_id,))
        conn.commit()
    finally:
        conn.close()