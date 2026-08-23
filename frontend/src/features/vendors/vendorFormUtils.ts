import type { NewVendor, Vendor } from "../../api/client"

export const WORKSHOP_TYPES = ["lecture", "art", "interactive", "stem", "beach", "sport", "film"]

export const EMPTY_VENDOR_FORM = {
  name: "",
  available_start: "09:00",
  available_end: "15:00",
  session_duration: "30",
  capacity_per_session: "30",
  tags: "",
  workshop_type: "",
  target_ages: "",
  excluded_ages: "",
  travel_time: "0",
  wants_break: true,
  break_duration: "10",
}

export type VendorFormState = typeof EMPTY_VENDOR_FORM

export const parseAges = (text: string): number[] =>
  text
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a !== "")
    .map(Number)

export const formToVendor = (form: VendorFormState): NewVendor => ({
  name: form.name,
  available_start: form.available_start,
  available_end: form.available_end,
  session_duration: Number(form.session_duration),
  capacity_per_session: Number(form.capacity_per_session),
  tags: form.tags,
  workshop_type: form.workshop_type,
  target_ages: parseAges(form.target_ages),
  excluded_ages: parseAges(form.excluded_ages),
  travel_time: Number(form.travel_time),
  wants_break: form.wants_break,
  break_duration: Number(form.break_duration),
})

export const vendorToForm = (v: Vendor): VendorFormState => ({
  name: v.name,
  available_start: v.available_start,
  available_end: v.available_end,
  session_duration: String(v.session_duration),
  capacity_per_session: String(v.capacity_per_session),
  tags: v.tags,
  workshop_type: v.workshop_type,
  target_ages: v.target_ages.join(", "),
  excluded_ages: v.excluded_ages.join(", "),
  travel_time: String(v.travel_time),
  wants_break: v.wants_break,
  break_duration: String(v.break_duration),
})
