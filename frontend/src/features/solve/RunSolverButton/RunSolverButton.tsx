import { useTranslation } from "react-i18next"
import Button from "@mui/material/Button"
import type { SolveState } from "../../../hooks/useSolve"

interface RunSolverButtonProps {
  solve: SolveState
  size?: "small" | "medium" | "large"
}

// Shared by every page that can trigger a solve: Home, Solve, and each
// entity detail view (Vendor/Class/School) — "resolve from wherever you are".
const RunSolverButton = ({ solve, size = "medium" }: RunSolverButtonProps) => {
  const { t } = useTranslation()
  return (
    <Button variant="contained" size={size} onClick={solve.run} disabled={solve.solving}>
      {solve.solving ? t("solve.solving") : t("solve.runButton")}
    </Button>
  )
}

export default RunSolverButton
