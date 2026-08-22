import { useEffect, useState } from "react"
import { getClasses, getSchools, solve, type School, type SchoolClass, type SolveResult } from "../api"

export default function SolvePage() {
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [result, setResult] = useState<SolveResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [solving, setSolving] = useState(false)

  useEffect(() => {
    Promise.all([getClasses(), getSchools()]).then(([c, s]) => {
      setClasses(c)
      setSchools(s)
    })
  }, [])

  async function handleSolve() {
    setSolving(true)
    setError(null)
    setResult(null)
    try {
      setResult(await solve())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSolving(false)
    }
  }

  function classLabel(classId: string) {
    const c = classes.find((c) => c.id === Number(classId))
    if (!c) return `class #${classId}`
    const school = schools.find((s) => s.id === c.school_id)
    return `${school ? school.name + " — " : ""}${c.name}`
  }

  return (
    <>
      <h1>Solve</h1>

      <button onClick={handleSolve} disabled={solving}>
        {solving ? "Solving…" : "Run solver"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <>
          {result.alerts.length > 0 && (
            <div>
              <h2>Alerts</h2>
              <ul>
                {result.alerts.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {Object.entries(result.schedule).map(([classId, entries]) => (
            <div key={classId}>
              <h2>{classLabel(classId)}</h2>
              <ul>
                {entries.map((e, i) => (
                  <li key={i}>
                    {e.start}–{e.end} {e.label} ({e.kind})
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {result.grid && (
            <div>
              <h2>Master schedule</h2>

              {result.colors && (
                <div className="legend">
                  {Object.keys(result.schedule).map((classId) => (
                    <span key={classId} className="legend-item">
                      <span
                        className="legend-swatch"
                        style={{ background: result.colors![classId] ?? "#dddddd" }}
                      />
                      {classLabel(classId)}
                    </span>
                  ))}
                </div>
              )}

              <table className="entity-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    {result.grid.vendor_names.map((name) => (
                      <th key={name}>{name}</th>
                    ))}
                    <th>Break</th>
                  </tr>
                </thead>
                <tbody>
                  {result.grid.times.map((t) => (
                    <tr key={t}>
                      <td>{t}</td>
                      {result.grid!.vendor_names.map((name) => {
                        const entries = result.grid!.cell_text[t][name]
                        const color = entries.length > 0 ? result.colors?.[entries[0].class_id] : undefined
                        return (
                          <td key={name} style={color ? { background: color } : undefined}>
                            {entries.map((e) => e.text).join(" / ")}
                          </td>
                        )
                      })}
                      <td className="break-cell">
                        {result.grid!.break_text[t].map((e) => e.text).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
