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
        </>
      )}
    </>
  )
}
