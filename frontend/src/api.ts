// api.ts — talks to the FastAPI backend. One function per endpoint,
// matching the "every button = one real API call" design of main.py.

const API_BASE = "http://127.0.0.1:8000"

export interface Vendor {
  id: number
  name: string
  available_start: string // "HH:MM"
  available_end: string   // "HH:MM"
  session_duration: number
  capacity_per_session: number
  tags: string
  workshop_type: string
  target_ages: number[]   // school years, e.g. [8, 9]; empty = no restriction
  excluded_ages: number[]
  travel_time: number
  wants_break: boolean
  break_duration: number
}

export type NewVendor = Omit<Vendor, "id">

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `${options?.method ?? "GET"} ${path} failed: ${res.status}`)
  }
  return res.json()
}

export function getVendors(): Promise<Vendor[]> {
  return request("/vendors")
}

export function createVendor(vendor: NewVendor): Promise<Vendor> {
  return request("/vendors", { method: "POST", body: JSON.stringify(vendor) })
}

export function updateVendor(id: number, vendor: NewVendor): Promise<Vendor> {
  return request(`/vendors/${id}`, { method: "PUT", body: JSON.stringify(vendor) })
}

export function deleteVendor(id: number): Promise<{ deleted: number }> {
  return request(`/vendors/${id}`, { method: "DELETE" })
}

export interface School {
  id: number
  name: string
  arrival_time: string   // "HH:MM"
  departure_time: string // "HH:MM"
}

export type NewSchool = Omit<School, "id">

export function getSchools(): Promise<School[]> {
  return request("/schools")
}

export function createSchool(school: NewSchool): Promise<School> {
  return request("/schools", { method: "POST", body: JSON.stringify(school) })
}

export function updateSchool(id: number, school: NewSchool): Promise<School> {
  return request(`/schools/${id}`, { method: "PUT", body: JSON.stringify(school) })
}

export function deleteSchool(id: number): Promise<{ deleted: number }> {
  return request(`/schools/${id}`, { method: "DELETE" })
}

export interface SchoolClass {
  id: number
  school_id: number
  name: string
  capacity: number
  age_group: number[]   // school years, e.g. [8, 9] for a combined class
  target_workshops: number
}

export type NewSchoolClass = Omit<SchoolClass, "id">

export function getClasses(schoolId?: number): Promise<SchoolClass[]> {
  const qs = schoolId != null ? `?school_id=${schoolId}` : ""
  return request(`/classes${qs}`)
}

export function createClass(cls: NewSchoolClass): Promise<SchoolClass> {
  return request("/classes", { method: "POST", body: JSON.stringify(cls) })
}

export function updateClass(id: number, cls: NewSchoolClass): Promise<SchoolClass> {
  return request(`/classes/${id}`, { method: "PUT", body: JSON.stringify(cls) })
}

export function deleteClass(id: number): Promise<{ deleted: number }> {
  return request(`/classes/${id}`, { method: "DELETE" })
}

export interface ScheduleEntry {
  start: string // "HH:MM"
  end: string   // "HH:MM"
  label: string
  kind: "workshop" | "recess" | "lunch"
}

export interface GridEntry {
  class_id: string
  text: string
}

export interface GridData {
  times: string[]         // "HH:MM" row labels
  vendor_names: string[]  // column labels
  cell_text: Record<string, Record<string, GridEntry[]>>  // time -> vendor name -> entries
  break_text: Record<string, GridEntry[]>                 // time -> entries
}

export interface SolveResult {
  schedule: Record<string, ScheduleEntry[]> // keyed by class id (as string)
  alerts: string[]
  grid: GridData | null
  colors: Record<string, string> | null // class id -> hex color
}

export function solve(): Promise<SolveResult> {
  return request("/solve", { method: "POST" })
}
