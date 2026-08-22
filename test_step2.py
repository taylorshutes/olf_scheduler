"""
test_step2.py — proves db.py + vendors.py + schools.py + classes.py
actually work together, including the school_id foreign key.

Run this directly. It's not part of the "real" app — just a check.
"""

from db import create_tables
from vendors import add_vendor, get_vendors, delete_vendor
from schools import add_school, get_schools, delete_school
from classes import add_class, get_classes, delete_class

create_tables()

print("Adding a school...")
school_id = add_school("Bondi Beach Public", "09:00", "15:00")
print("  school id:", school_id)

print("\nAdding classes for that school...")
c1 = add_class(school_id, "Year 3&4", 27, "upper-primary")
c2 = add_class(school_id, "Year 5&6", 24, "upper-primary")
print("  class ids:", c1, c2)

print("\nClasses for this school:")
for row in get_classes(school_id=school_id):
    print(" ", row)

print("\nAdding a vendor...")
v1 = add_vendor(
    "Robotics Lab",
    available_start="09:00",
    available_end="14:30",
    session_duration=45,
    capacity_per_session=30,
    tags="stem,hands-on",
    workshop_type="interactive",
    target_ages="upper-primary,secondary",
)
print("Vendors:", get_vendors())

print("\nUpdating a couple of vendor fields via **fields...")
from vendors import update_vendor
update_vendor(v1, capacity_per_session=25, tags="stem,art")
print("Vendors after update:", get_vendors())

print("\nCleaning up (deleting everything we just added)...")
delete_class(c1)
delete_class(c2)
delete_school(school_id)
delete_vendor(v1)

print("Schools left:", get_schools())
print("Classes left:", get_classes())
print("Vendors left:", get_vendors())