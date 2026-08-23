import { useState } from "react"
import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { PageHeader, AlertBanner } from "../../../components"
import SchoolForm from "../../schools/SchoolForm"
import { schoolToForm } from "../../schools/schoolFormUtils"
import RunSolverButton from "../../solve/RunSolverButton"
import ClassScheduleList from "../../solve/ClassScheduleList"
import { assignWorkshopColors } from "../../solve/workshopColors"
import { useVendors } from "../../../hooks/useVendors"
import type { SolveState } from "../../../hooks/useSolve"
import type { NewSchool, School, SchoolClass } from "../../../api/client"

interface SchoolDetailPageProps {
  school: School
  classes: SchoolClass[]
  solve: SolveState
  onUpdate: (id: number, school: NewSchool) => Promise<unknown>
  onSelectClass: (classId: number) => void
  onBack: () => void
}

const SchoolDetailPage = ({ school, classes, solve, onUpdate, onSelectClass, onBack }: SchoolDetailPageProps) => {
  const { t } = useTranslation()
  const { result } = solve
  const { vendors } = useVendors()
  const workshopColors = assignWorkshopColors(vendors)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => schoolToForm(school))
  const [error, setError] = useState<string | null>(null)

  const schoolClasses = classes.filter((c) => c.school_id === school.id)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await onUpdate(school.id, form)
      solve.clear()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleCancelEdit = () => {
    setForm(schoolToForm(school))
    setEditing(false)
  }

  const stats: [string, string][] = [
    [t("schools.fields.name"), school.name],
    [t("schools.columns.arrival"), school.arrival_time],
    [t("schools.columns.departure"), school.departure_time],
  ]

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 1 }}>
        {t("common.back")}
      </Button>
      <PageHeader>{school.name}</PageHeader>
      <AlertBanner message={error} />

      {editing ? (
        <SchoolForm
          form={form}
          setForm={setForm}
          onSubmit={handleSave}
          submitLabel={t("common.save")}
          onCancel={handleCancelEdit}
        />
      ) : (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 0.5, mb: 2 }}>
            {stats.map(([label, value]) => (
              <Box key={label} sx={{ display: "contents" }}>
                <Typography color="text.secondary">{label}</Typography>
                <Typography>{value}</Typography>
              </Box>
            ))}
          </Box>
          <Button variant="outlined" size="small" onClick={() => setEditing(true)}>
            {t("common.edit")}
          </Button>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography variant="h6">{t("schools.detail.classesTitle")}</Typography>
        <RunSolverButton solve={solve} size="small" />
      </Box>

      {schoolClasses.length === 0 ? (
        <Typography color="text.secondary">{t("schools.detail.noClasses")}</Typography>
      ) : !result ? (
        <>
          <List dense>
            {schoolClasses.map((c) => (
              <ListItemButton key={c.id} onClick={() => onSelectClass(c.id)}>
                <ListItemText primary={c.name} secondary={c.age_group.join(", ")} />
              </ListItemButton>
            ))}
          </List>
          <Typography color="text.secondary">{t("solve.noResultYet")}</Typography>
        </>
      ) : (
        schoolClasses.map((c) => (
          <Box
            key={c.id}
            sx={{ mb: 2, borderLeft: 4, borderColor: result.colors?.[String(c.id)] ?? "divider", pl: 1.5 }}
          >
            <ListItemButton onClick={() => onSelectClass(c.id)} sx={{ pl: 0 }}>
              <ListItemText primary={c.name} secondary={c.age_group.join(", ")} />
            </ListItemButton>
            <ClassScheduleList entries={result.schedule[String(c.id)] ?? []} workshopColors={workshopColors} />
          </Box>
        ))
      )}
    </Box>
  )
}

export default SchoolDetailPage
