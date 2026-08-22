"""
models.py — the solver's data model: Vendor and SchoolClass, the
eligibility check, and minutes<->clock time helpers.
"""

from dataclasses import dataclass, field


@dataclass
class Vendor:
    id: str
    name: str
    available_start: int          # minutes from midnight
    available_end: int
    session_duration: int         # minutes
    capacity_per_session: int
    tags: list = field(default_factory=list)
    workshop_type: str = "interactive"
    target_ages: list = field(default_factory=list)   # empty = no restriction
    excluded_ages: list = field(default_factory=list)
    travel_time: int = 0
    wants_break: bool = True
    break_duration: int = 10

    def sessions(self):
        step = self.session_duration + (self.break_duration if self.wants_break else 0)
        slots = []
        t = self.available_start
        while t + self.session_duration <= self.available_end:
            slots.append((t, t + self.session_duration))
            t += step
        return slots


@dataclass
class SchoolClass:
    id: str
    name: str
    school_id: str
    capacity: int
    age_group: list   # school years, e.g. [8, 9] for a combined class
    arrival: int
    departure: int
    target_workshops: int = 1


def eligible(cls, vendor, session):
    start, end = session
    class_ages = set(cls.age_group)
    if vendor.target_ages and not class_ages & set(vendor.target_ages):
        return False
    if class_ages & set(vendor.excluded_ages):
        return False
    if start < cls.arrival or end > cls.departure:
        return False
    return True


def minutes_to_clock(m: int) -> str:
    h, mm = divmod(int(m), 60)
    return f"{h:02d}:{mm:02d}"


def clock_to_minutes(s: str) -> int:
    h, m = s.strip().split(":")
    return int(h) * 60 + int(m)
