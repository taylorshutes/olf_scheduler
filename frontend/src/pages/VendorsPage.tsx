import { useEffect, useState } from "react"
import { createVendor, deleteVendor, getVendors, updateVendor, type NewVendor, type Vendor } from "../api"

const WORKSHOP_TYPES = ["lecture", "art", "interactive", "stem", "beach", "sport", "film"]

const EMPTY_FORM = {
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

function parseAges(text: string): number[] {
  return text
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a !== "")
    .map(Number)
}

function formToVendor(form: typeof EMPTY_FORM): NewVendor {
  return {
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
  }
}

function vendorToForm(v: Vendor): typeof EMPTY_FORM {
  return {
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
  }
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  function loadVendors() {
    getVendors()
      .then(setVendors)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadVendors, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (editingId != null) {
        await updateVendor(editingId, formToVendor(form))
      } else {
        await createVendor(formToVendor(form))
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      loadVendors()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  function handleEdit(v: Vendor) {
    setForm(vendorToForm(v))
    setEditingId(v.id)
  }

  function handleCancelEdit() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  async function handleDelete(id: number) {
    setError(null)
    try {
      await deleteVendor(id)
      if (editingId === id) handleCancelEdit()
      loadVendors()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <>
      <h1>Vendors</h1>
      {error && <p className="error">{error}</p>}

      <form className="entity-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Available start
          <input
            type="time"
            value={form.available_start}
            onChange={(e) => setForm({ ...form, available_start: e.target.value })}
          />
        </label>
        <label>
          Available end
          <input
            type="time"
            value={form.available_end}
            onChange={(e) => setForm({ ...form, available_end: e.target.value })}
          />
        </label>
        <label>
          Session duration (min)
          <input
            type="number"
            min={1}
            value={form.session_duration}
            onChange={(e) => setForm({ ...form, session_duration: e.target.value })}
          />
        </label>
        <label>
          Capacity per session
          <input
            type="number"
            min={1}
            value={form.capacity_per_session}
            onChange={(e) => setForm({ ...form, capacity_per_session: e.target.value })}
          />
        </label>
        <label>
          Tags (comma-separated)
          <input
            placeholder="stem, hands-on"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </label>
        <label>
          Workshop type
          <select
            value={form.workshop_type}
            onChange={(e) => setForm({ ...form, workshop_type: e.target.value })}
          >
            <option value="">(none)</option>
            {WORKSHOP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Target Year Groups (comma-separated)
          <input
            placeholder="8, 9"
            value={form.target_ages}
            onChange={(e) => setForm({ ...form, target_ages: e.target.value })}
          />
        </label>
        <label>
          Excluded ages (years, comma-separated)
          <input
            placeholder="10"
            value={form.excluded_ages}
            onChange={(e) => setForm({ ...form, excluded_ages: e.target.value })}
          />
        </label>
        <label>
          Travel time (min)
          <input
            type="number"
            min={0}
            value={form.travel_time}
            onChange={(e) => setForm({ ...form, travel_time: e.target.value })}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.wants_break}
            onChange={(e) => setForm({ ...form, wants_break: e.target.checked })}
          />
          Wants break between sessions
        </label>
        <label>
          Break duration (min)
          <input
            type="number"
            min={0}
            value={form.break_duration}
            onChange={(e) => setForm({ ...form, break_duration: e.target.value })}
          />
        </label>
        <button type="submit">{editingId != null ? "Save changes" : "Add vendor"}</button>
        {editingId != null && (
          <button type="button" onClick={handleCancelEdit}>
            Cancel
          </button>
        )}
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Hours</th>
              <th>Session</th>
              <th>Capacity</th>
              <th>Target Year Groups</th>
              <th>Excluded ages</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>{v.available_start}–{v.available_end}</td>
                <td>{v.session_duration} min</td>
                <td>{v.capacity_per_session}</td>
                <td>{v.target_ages.join(", ") || "any"}</td>
                <td>{v.excluded_ages.join(", ") || "—"}</td>
                <td>
                  <button onClick={() => handleEdit(v)}>Edit</button>
                  <button onClick={() => handleDelete(v.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
