import { useEffect, useState } from "react"
import {
  createClass,
  createSchool,
  deleteClass,
  getClasses,
  getSchools,
  type NewSchoolClass,
  type School,
  type SchoolClass,
} from "../api"

const NEW_SCHOOL = "__new__"

const EMPTY_FORM = {
  school_id: NEW_SCHOOL as string,
  new_school_name: "",
  new_school_arrival: "09:00",
  new_school_departure: "15:00",
  name: "",
  capacity: "25",
  age_group: "",
  target_workshops: "1",
}

function parseAges(text: string): number[] {
  return text
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a !== "")
    .map(Number)
}

function formToClass(form: typeof EMPTY_FORM, schoolId: number): NewSchoolClass {
  return {
    school_id: schoolId,
    name: form.name,
    capacity: Number(form.capacity),
    age_group: parseAges(form.age_group),
    target_workshops: Number(form.target_workshops),
  }
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  function loadAll() {
    Promise.all([getClasses(), getSchools()])
      .then(([classRows, schoolRows]) => {
        setClasses(classRows)
        setSchools(schoolRows)
        setForm((f) => (f.school_id === NEW_SCHOOL && schoolRows.length > 0
          ? { ...f, school_id: String(schoolRows[0].id) }
          : f))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      let schoolId: number
      if (form.school_id === NEW_SCHOOL) {
        const school = await createSchool({
          name: form.new_school_name,
          arrival_time: form.new_school_arrival,
          departure_time: form.new_school_departure,
        })
        schoolId = school.id
      } else {
        schoolId = Number(form.school_id)
      }
      await createClass(formToClass(form, schoolId))
      setForm({ ...EMPTY_FORM, school_id: String(schoolId) })
      loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function handleDelete(id: number) {
    setError(null)
    try {
      await deleteClass(id)
      loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const schoolName = (id: number) => schools.find((s) => s.id === id)?.name ?? `#${id}`
  const addingNewSchool = form.school_id === NEW_SCHOOL

  return (
    <>
      <h1>Classes</h1>
      {error && <p className="error">{error}</p>}

      <form className="entity-form" onSubmit={handleSubmit}>
        <label>
          School
          <select
            value={form.school_id}
            onChange={(e) => setForm({ ...form, school_id: e.target.value })}
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value={NEW_SCHOOL}>+ Add new school</option>
          </select>
        </label>

        {addingNewSchool && (
          <>
            <label>
              New school name
              <input
                required
                value={form.new_school_name}
                onChange={(e) => setForm({ ...form, new_school_name: e.target.value })}
              />
            </label>
            <label>
              Arrival time
              <input
                type="time"
                value={form.new_school_arrival}
                onChange={(e) => setForm({ ...form, new_school_arrival: e.target.value })}
              />
            </label>
            <label>
              Departure time
              <input
                type="time"
                value={form.new_school_departure}
                onChange={(e) => setForm({ ...form, new_school_departure: e.target.value })}
              />
            </label>
          </>
        )}

        <label>
          Name
          <input
            required
            placeholder="Year 8/9"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Capacity
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />
        </label>
        <label>
          Year Groups (comma-separated)
          <input
            required
            placeholder="8, 9"
            value={form.age_group}
            onChange={(e) => setForm({ ...form, age_group: e.target.value })}
          />
        </label>
        <label>
          Target workshops
          <input
            type="number"
            min={0}
            value={form.target_workshops}
            onChange={(e) => setForm({ ...form, target_workshops: e.target.value })}
          />
        </label>
        <button type="submit">Add class</button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>School</th>
              <th>Name</th>
              <th>Capacity</th>
              <th>Year Groups</th>
              <th>Target workshops</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td>{schoolName(c.school_id)}</td>
                <td>{c.name}</td>
                <td>{c.capacity}</td>
                <td>{c.age_group.join(", ")}</td>
                <td>{c.target_workshops}</td>
                <td>
                  <button onClick={() => handleDelete(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
