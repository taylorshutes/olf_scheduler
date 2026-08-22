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

export function deleteVendor(id: number): Promise<{ deleted: number }> {
  return request(`/vendors/${id}`, { method: "DELETE" })
}
