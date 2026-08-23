import { useState } from "react"
import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { PageHeader, AlertBanner } from "../../../components"
import ClassForm from "../../classes/ClassForm"
import { classToForm, formToClass } from "../../classes/classFormUtils"
import ClassScheduleList from "../../solve/ClassScheduleList"
import RunSolverButton from "../../solve/RunSolverButton"
import { assignWorkshopColors } from "../../solve/workshopColors"
import { useVendors } from "../../../hooks/useVendors"
import type { SolveState } from "../../../hooks/useSolve"
import type { NewSchoolClass, School, SchoolClass } from "../../../api/client"

interface ClassDetailPageProps {
  cls: SchoolClass
  schools: School[]
  solve: SolveState
  onUpdate: (id: number, cls: NewSchoolClass) => Promise<unknown>
  onBack: () => void
}

const ClassDetailPage = ({ cls, schools, solve, onUpdate, onBack }: ClassDetailPageProps) => {
  const { t } = useTranslation()
  const { result } = solve
  const { vendors } = useVendors()
  const workshopColors = assignWorkshopColors(vendors)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => classToForm(cls))
  const [error, setError] = useState<string | null>(null)

  const schoolName = schools.find((s) => s.id === cls.school_id)?.name ?? `#${cls.school_id}`

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await onUpdate(cls.id, formToClass(form, Number(form.school_id)))
      solve.clear()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleCancelEdit = () => {
    setForm(classToForm(cls))
    setEditing(false)
  }

  const stats: [string, string][] = [
    [t("classes.columns.school"), schoolName],
    [t("classes.fields.name"), cls.name],
    [t("classes.fields.capacity"), String(cls.capacity)],
    [t("classes.columns.yearGroups"), cls.age_group.join(", ")],
    [t("classes.fields.targetWorkshops"), String(cls.target_workshops)],
  ]

  const entries = result?.schedule[String(cls.id)] ?? []

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 1 }}>
        {t("common.back")}
      </Button>
      <PageHeader>{cls.name}</PageHeader>
      <AlertBanner message={error} />

      {editing ? (
        <ClassForm
          form={form}
          setForm={setForm}
          schools={schools}
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
        <Typography variant="h6">{t("classes.detail.scheduleTitle")}</Typography>
        <RunSolverButton solve={solve} size="small" />
      </Box>

      {!result ? (
        <Typography color="text.secondary">{t("solve.noResultYet")}</Typography>
      ) : (
        <ClassScheduleList entries={entries} workshopColors={workshopColors} />
      )}
    </Box>
  )
}

export default ClassDetailPage
