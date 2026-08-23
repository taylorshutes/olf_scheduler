import { useState } from "react"
import { solve, type SolveResult } from "../api/client"

export const useSolve = () => {
  const [result, setResult] = useState<SolveResult | null>(null)
  const [solving, setSolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
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

  // Called after any vendor/school/class edit — the last solve no longer
  // necessarily reflects current data, so drop it rather than show a
  // schedule that might be wrong. The user re-runs explicitly.
  const clear = () => {
    setResult(null)
    setError(null)
  }

  return { result, solving, error, run, clear }
}

// So Home and Solve pages can share one solve state, lifted up to App.tsx
// and passed down as a prop instead of each page running its own solver.
export type SolveState = ReturnType<typeof useSolve>
