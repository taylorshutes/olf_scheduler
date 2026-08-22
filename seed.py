"""
seed.py — wipes vendors/schools/classes and reloads a fixed, realistic
test dataset. Run directly:

    python3 seed.py

For quick manual testing only — not part of the API/app itself.
"""

from db import create_tables, get_connection
from vendors import add_vendor
from schools import add_school
from classes import add_class

SCHOOLS = [
    dict(name="Bondi Beach Public School", arrival_time="09:00", departure_time="15:00"),
    dict(name="St Marys", arrival_time="09:15", departure_time="14:45"),
    dict(name="Sceggs", arrival_time="09:00", departure_time="15:15"),
]

# Each class references a school by index into SCHOOLS above.
CLASSES = [
    dict(school=0, name="3B", capacity=27, age_group="3", target_workshops=2),
    dict(school=0, name="5/6M", capacity=24, age_group="5,6", target_workshops=2),
    dict(school=1, name="4G", capacity=22, age_group="4", target_workshops=1),
    dict(school=2, name="Year 8", capacity=30, age_group="8", target_workshops=2),
    dict(school=2, name="Year 9/10", capacity=28, age_group="9,10", target_workshops=1),
]

VENDORS = [
    dict(name="Robotics Lab", available_start="09:00", available_end="14:30",
         session_duration=45, capacity_per_session=30, tags="stem,hands-on",
         workshop_type="interactive", target_ages="5,6,7,8,9,10", excluded_ages="",
         travel_time=0, wants_break=True, break_duration=10),
    dict(name="Beach Safety Talk", available_start="09:00", available_end="13:00",
         session_duration=30, capacity_per_session=100, tags="beach,safety",
         workshop_type="lecture", target_ages="", excluded_ages="",
         travel_time=10, wants_break=True, break_duration=5),
    dict(name="Story Time Theatre", available_start="09:00", available_end="14:00",
         session_duration=40, capacity_per_session=25, tags="art,performance",
         workshop_type="art", target_ages="3,4,5,6", excluded_ages="",
         travel_time=0, wants_break=True, break_duration=10),
    dict(name="Local History Walk", available_start="09:30", available_end="14:30",
         session_duration=60, capacity_per_session=20, tags="history,outdoors",
         workshop_type="interactive", target_ages="8,9,10", excluded_ages="",
         travel_time=15, wants_break=True, break_duration=15),
    dict(name="Film Making Workshop", available_start="09:00", available_end="14:00",
         session_duration=50, capacity_per_session=15, tags="film,creative",
         workshop_type="film", target_ages="8,9,10", excluded_ages="",
         travel_time=0, wants_break=False, break_duration=0),
]


def wipe():
    conn = get_connection()
    try:
        conn.execute("DELETE FROM classes")
        conn.execute("DELETE FROM schools")
        conn.execute("DELETE FROM vendors")
        conn.commit()
    finally:
        conn.close()


def seed():
    create_tables()
    wipe()

    school_ids = [add_school(**s) for s in SCHOOLS]
    for c in CLASSES:
        add_class(
            school_id=school_ids[c["school"]],
            name=c["name"],
            capacity=c["capacity"],
            age_group=c["age_group"],
            target_workshops=c["target_workshops"],
        )
    for v in VENDORS:
        add_vendor(**v)

    print(f"Seeded {len(school_ids)} schools, {len(CLASSES)} classes, {len(VENDORS)} vendors.")


if __name__ == "__main__":
    seed()
