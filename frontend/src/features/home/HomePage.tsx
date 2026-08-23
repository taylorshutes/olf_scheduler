import { useState } from "react"
import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import Typography from "@mui/material/Typography"
import { useVendors } from "../../hooks/useVendors"
import { useSchools } from "../../hooks/useSchools"
import { useClasses } from "../../hooks/useClasses"
import type { SolveState } from "../../hooks/useSolve"
import MasterScheduleGrid from "../solve/MasterScheduleGrid"
import RunSolverButton from "../solve/RunSolverButton"
import { makeClassLabel } from "../solve/classLabel"
import SideNav, { type EntityType } from "./SideNav"
import VendorDetailPage from "./VendorDetailPage"
import ClassDetailPage from "./ClassDetailPage"
import SchoolDetailPage from "./SchoolDetailPage"

interface HomePageProps {
  solve: SolveState
  onNavigate: (tab: string) => void
}

interface Selection {
  type: EntityType
  id: number
}

const HomePage = ({ solve, onNavigate }: HomePageProps) => {
  const { t } = useTranslation()
  const { vendors, update: updateVendor } = useVendors()
  const { schools, update: updateSchool } = useSchools()
  const { classes, update: updateClass } = useClasses()
  const { result } = solve
  const [selected, setSelected] = useState<Selection | null>(null)

  const classLabel = (classId: string) =>
    makeClassLabel(classId, classes, schools, (id) => t("solve.unknownClass", { id }))

  const onSelect = (type: EntityType, id: number) => setSelected({ type, id })
  const onBack = () => setSelected(null)

  const selectedVendor = selected?.type === "vendor" ? vendors.find((v) => v.id === selected.id) : undefined
  const selectedSchool = selected?.type === "school" ? schools.find((s) => s.id === selected.id) : undefined
  const selectedClass = selected?.type === "class" ? classes.find((c) => c.id === selected.id) : undefined

  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      <SideNav vendors={vendors} schools={schools} classes={classes} onNavigate={onNavigate} onSelect={onSelect} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {selectedVendor ? (
          <VendorDetailPage
            vendor={selectedVendor}
            classes={classes}
            schools={schools}
            solve={solve}
            onUpdate={updateVendor}
            onBack={onBack}
          />
        ) : selectedClass ? (
          <ClassDetailPage
            cls={selectedClass}
            schools={schools}
            solve={solve}
            onUpdate={updateClass}
            onBack={onBack}
          />
        ) : selectedSchool ? (
          <SchoolDetailPage
            school={selectedSchool}
            classes={classes}
            solve={solve}
            onUpdate={updateSchool}
            onSelectClass={(classId) => onSelect("class", classId)}
            onBack={onBack}
          />
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Chip label={`${t("home.vendorsCount")}: ${vendors.length}`} size="small" />
              <Chip label={`${t("home.schoolsCount")}: ${schools.length}`} size="small" />
              <Chip label={`${t("home.classesCount")}: ${classes.length}`} size="small" />
              <Box sx={{ ml: "auto" }}>
                <RunSolverButton solve={solve} size="small" />
              </Box>
            </Box>

            {result ? (
              <MasterScheduleGrid result={result} classLabel={classLabel} />
            ) : (
              <Typography color="text.secondary">{t("solve.noResultYet")}</Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}

export default HomePage
