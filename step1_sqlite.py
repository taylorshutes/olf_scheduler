"""
Step 1: SQLite foundation — vendors only.

Just proving that data actually saves to disk and survives.
No UI, no solver, nothing fancy. Run this file directly to see it work.

Creates a file called excursion.db in the same folder — that's your
actual database. You can open it with a free tool like "DB Browser for
SQLite" (https://sqlitebrowser.org/) to see the raw rows yourself.
"""

import sqlite3

DB_PATH = "excursion.db"


def get_connection():
    return sqlite3.connect(DB_PATH)


def create_tables():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            capacity_per_session INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def add_vendor(name, capacity_per_session):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO vendors (name, capacity_per_session) VALUES (?, ?)",
        (name, capacity_per_session),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id


def get_vendors():
    conn = get_connection()
    rows = conn.execute("SELECT id, name, capacity_per_session FROM vendors").fetchall()
    conn.close()
    return rows


def update_vendor(vendor_id, name=None, capacity_per_session=None):
    conn = get_connection()
    if name is not None:
        conn.execute("UPDATE vendors SET name = ? WHERE id = ?", (name, vendor_id))
    if capacity_per_session is not None:
        conn.execute(
            "UPDATE vendors SET capacity_per_session = ? WHERE id = ?",
            (capacity_per_session, vendor_id),
        )
    conn.commit()
    conn.close()


def delete_vendor(vendor_id):
    conn = get_connection()
    conn.execute("DELETE FROM vendors WHERE id = ?", (vendor_id,))
    conn.commit()
    conn.close()


if __name__ == "__main__":
    create_tables()

    print("Adding a vendor...")
    vid = add_vendor("Robotics Lab", 30)
    print("  -> got id", vid)

    print("\nAll vendors:")
    for row in get_vendors():
        print(" ", row)

    print("\nUpdating capacity...")
    update_vendor(vid, capacity_per_session=25)
    for row in get_vendors():
        print(" ", row)

    print("\nDeleting it...")
    delete_vendor(vid)
    print("Vendors left:", get_vendors())