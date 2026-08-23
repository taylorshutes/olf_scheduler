import type { SchoolClass, SolveResult, Vendor } from "../../../api/client"

const GAP_THRESHOLD_MINUTES = 15

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

const toClock = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export interface VendorSession {
  start: string
  end: string
  classIds: string[]
  totalKids: number
}

export interface VendorTimetableEntry {
  kind: "session" | "gap"
  start: string
  end: string
  session?: VendorSession
}

// Pivots the solver's per-class schedule into "what does this vendor's day
// look like" — every session where this vendor's name shows up as a
// workshop, grouped by time slot (so classes double-booked into the same
// large session show up as one row), plus any gap of GAP_THRESHOLD_MINUTES
// or more flagged as a suggested break.
export const buildVendorTimetable = (
  vendor: Vendor,
  classes: SchoolClass[],
  result: SolveResult | null,
): VendorTimetableEntry[] => {
  if (!result) return []

  const sessionsByRange = new Map<string, VendorSession>()
  for (const [classId, entries] of Object.entries(result.schedule)) {
    for (const entry of entries) {
      if (entry.kind !== "workshop" || entry.label !== vendor.name) continue
      const key = `${entry.start}-${entry.end}`
      const cls = classes.find((c) => c.id === Number(classId))
      const kids = cls?.capacity ?? 0
      const existing = sessionsByRange.get(key)
      if (existing) {
        existing.classIds.push(classId)
        existing.totalKids += kids
      } else {
        sessionsByRange.set(key, { start: entry.start, end: entry.end, classIds: [classId], totalKids: kids })
      }
    }
  }

  const sessions = [...sessionsByRange.values()].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))

  const timetable: VendorTimetableEntry[] = []
  let cursor = toMinutes(vendor.available_start)

  for (const session of sessions) {
    const sessionStart = toMinutes(session.start)
    if (sessionStart - cursor >= GAP_THRESHOLD_MINUTES) {
      timetable.push({ kind: "gap", start: toClock(cursor), end: session.start })
    }
    timetable.push({ kind: "session", start: session.start, end: session.end, session })
    cursor = toMinutes(session.end)
  }

  const dayEnd = toMinutes(vendor.available_end)
  if (dayEnd - cursor >= GAP_THRESHOLD_MINUTES) {
    timetable.push({ kind: "gap", start: toClock(cursor), end: vendor.available_end })
  }

  return timetable
}
