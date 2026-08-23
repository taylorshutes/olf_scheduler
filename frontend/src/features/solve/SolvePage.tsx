import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import { PageHeader, AlertBanner } from "../../components"
import { useClasses } from "../../hooks/useClasses"
import { useSchools } from "../../hooks/useSchools"
import { useVendors } from "../../hooks/useVendors"
import type { SolveState } from "../../hooks/useSolve"
import MasterScheduleGrid from "./MasterScheduleGrid"
import RunSolverButton from "./RunSolverButton"
import ClassScheduleList from "./ClassScheduleList"
import { makeClassLabel } from "./classLabel"
import { assignWorkshopColors } from "./workshopColors"

interface SolvePageProps {
  solve: SolveState
}

const SolvePage = ({ solve }: SolvePageProps) => {
  const { t } = useTranslation()
  const { result, error } = solve
  const { classes } = useClasses()
  const { schools } = useSchools()
  const { vendors } = useVendors()
  const workshopColors = assignWorkshopColors(vendors)

  const classLabel = (classId: string) =>
    makeClassLabel(classId, classes, schools, (id) => t("solve.unknownClass", { id }))

  return (
    <>
      <PageHeader>{t("solve.title")}</PageHeader>

      <Box sx={{ mb: 2 }}>
        <RunSolverButton solve={solve} />
      </Box>

      <AlertBanner message={error} />

      {result && (
        <>
          {result.alerts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">{t("solve.alertsTitle")}</Typography>
              <List dense>
                {result.alerts.map((a, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={a} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {Object.entries(result.schedule).map(([classId, entries]) => (
            <Box key={classId} sx={{ mb: 3 }}>
              <Typography variant="h6">{classLabel(classId)}</Typography>
              <ClassScheduleList entries={entries} workshopColors={workshopColors} />
            </Box>
          ))}

          <MasterScheduleGrid result={result} classLabel={classLabel} />
        </>
      )}
    </>
  )
}

export default SolvePage
