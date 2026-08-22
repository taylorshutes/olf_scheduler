"""
db.py — shared SQLite connection + table schema.

Every other file (vendors.py, schools.py, classes.py) imports
get_connection() from here. This is the ONLY file that defines
what the tables look like.
"""

import sqlite3

DB_PATH = "excursion.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")  # enforce school_id links actually being valid
    return conn


def create_tables():
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            available_start TEXT NOT NULL,      -- "HH:MM"
            available_end TEXT NOT NULL,        -- "HH:MM"
            session_duration INTEGER NOT NULL,  -- minutes
            capacity_per_session INTEGER NOT NULL,
            tags TEXT DEFAULT '',                -- comma-separated, e.g. "stem,hands-on"
            workshop_type TEXT DEFAULT '',       -- e.g. "lecture" / "interactive" / "art"
            target_ages TEXT DEFAULT '',         -- comma-separated school years, e.g. "7,8,9"; empty = no restriction
            excluded_ages TEXT DEFAULT '',       -- comma-separated school years
            travel_time INTEGER DEFAULT 0,       -- minutes to reach this vendor
            wants_break INTEGER DEFAULT 1,       -- 0 or 1
            break_duration INTEGER DEFAULT 10    -- minutes
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS schools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            arrival_time TEXT NOT NULL,      -- "HH:MM"
            departure_time TEXT NOT NULL     -- "HH:MM"
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            school_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            age_group TEXT NOT NULL,             -- comma-separated school years, e.g. "8,9"
            target_workshops INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (school_id) REFERENCES schools(id)
        )
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    create_tables()
    print("Tables created (or already existed) in", DB_PATH)