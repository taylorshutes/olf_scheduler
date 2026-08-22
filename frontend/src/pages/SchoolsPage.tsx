import { useEffect, useState } from "react"
import { createSchool, deleteSchool, getSchools, updateSchool, type NewSchool, type School } from "../api"

const EMPTY_FORM: NewSchool = {
  name: "",
  arrival_time: "09:00",
  departure_time: "15:00",
}

function schoolToForm(s: School): NewSchool {
  return { name: s.name, arrival_time: s.arrival_time, departure_time: s.departure_time }
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  function loadSchools() {
    getSchools()
      .then(setSchools)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadSchools, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (editingId != null) {
        await updateSchool(editingId, form)
      } else {
        await createSchool(form)
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      loadSchools()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  function handleEdit(s: School) {
    setForm(schoolToForm(s))
    setEditingId(s.id)
  }

  function handleCancelEdit() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  async function handleDelete(id: number) {
    setError(null)
    try {
      await deleteSchool(id)
      if (editingId === id) handleCancelEdit()
      loadSchools()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <>
      <h1>Schools</h1>
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
          Arrival time
          <input
            type="time"
            value={form.arrival_time}
            onChange={(e) => setForm({ ...form, arrival_time: e.target.value })}
          />
        </label>
        <label>
          Departure time
          <input
            type="time"
            value={form.departure_time}
            onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
          />
        </label>
        <button type="submit">{editingId != null ? "Save changes" : "Add school"}</button>
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
              <th>Arrival</th>
              <th>Departure</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.arrival_time}</td>
                <td>{s.departure_time}</td>
                <td>
                  <button onClick={() => handleEdit(s)}>Edit</button>
                  <button onClick={() => handleDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
