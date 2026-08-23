import { useState } from "react"
import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import Chip from "@mui/material/Chip"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { PageHeader, AlertBanner } from "../../../components"
import VendorForm from "../../vendors/VendorForm"
import { formToVendor, vendorToForm } from "../../vendors/vendorFormUtils"
import { makeClassLabel } from "../../solve/classLabel"
import RunSolverButton from "../../solve/RunSolverButton"
import { buildVendorTimetable } from "./vendorTimetable"
import type { SolveState } from "../../../hooks/useSolve"
import type { NewVendor, School, SchoolClass, Vendor } from "../../../api/client"

interface VendorDetailPageProps {
  vendor: Vendor
  classes: SchoolClass[]
  schools: School[]
  solve: SolveState
  onUpdate: (id: number, vendor: NewVendor) => Promise<unknown>
  onBack: () => void
}

const VendorDetailPage = ({ vendor, classes, schools, solve, onUpdate, onBack }: VendorDetailPageProps) => {
  const { t } = useTranslation()
  const { result: solveResult } = solve
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => vendorToForm(vendor))
  const [error, setError] = useState<string | null>(null)

  const classLabel = (classId: string) =>
    makeClassLabel(classId, classes, schools, (id) => t("solve.unknownClass", { id }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await onUpdate(vendor.id, formToVendor(form))
      solve.clear()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleCancelEdit = () => {
    setForm(vendorToForm(vendor))
    setEditing(false)
  }

  const stats: [string, string][] = [
    [t("vendors.fields.name"), vendor.name],
    [t("vendors.columns.hours"), `${vendor.available_start}–${vendor.available_end}`],
    [t("vendors.fields.sessionDuration"), `${vendor.session_duration} min`],
    [t("vendors.fields.capacityPerSession"), String(vendor.capacity_per_session)],
    [t("vendors.fields.tags"), vendor.tags || "—"],
    [t("vendors.fields.workshopType"), vendor.workshop_type || t("vendors.fields.workshopTypeNone")],
    [t("vendors.columns.targetYearGroups"), vendor.target_ages.join(", ") || t("vendors.columns.any")],
    [t("vendors.columns.excludedAges"), vendor.excluded_ages.join(", ") || "—"],
    [t("vendors.fields.travelTime"), `${vendor.travel_time} min`],
    [t("vendors.fields.breakDuration"), vendor.wants_break ? `${vendor.break_duration} min` : "—"],
  ]

  const timetable = buildVendorTimetable(vendor, classes, solveResult)

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 1 }}>
        {t("common.back")}
      </Button>
      <PageHeader>{vendor.name}</PageHeader>
      <AlertBanner message={error} />

      {editing ? (
        <VendorForm
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
        <Typography variant="h6">{t("vendors.detail.timetableTitle")}</Typography>
        <RunSolverButton solve={solve} size="small" />
      </Box>

      {!solveResult ? (
        <Typography color="text.secondary">{t("solve.noResultYet")}</Typography>
      ) : (
        <List dense>
          <ListItem>
            <ListItemText primary={`${t("vendors.detail.arrival")}: ${vendor.available_start}`} />
          </ListItem>
          {timetable.map((entry, i) =>
            entry.kind === "gap" ? (
              <ListItem key={i}>
                <ListItemText
                  primary={
                    <Typography color="success.main">
                      {t("vendors.detail.suggestedBreak")}: {entry.start}–{entry.end}
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              <ListItem key={i}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <span>
                        {entry.start}–{entry.end}
                      </span>
                      {entry.session!.classIds.map((classId) => (
                        <Chip
                          key={classId}
                          size="small"
                          label={classLabel(classId)}
                          sx={{ backgroundColor: solveResult.colors?.[classId] ?? undefined }}
                        />
                      ))}
                      <span>{t("vendors.detail.kids", { count: entry.session!.totalKids })}</span>
                    </Box>
                  }
                />
              </ListItem>
            ),
          )}
          <ListItem>
            <ListItemText primary={`${t("vendors.detail.departure")}: ${vendor.available_end}`} />
          </ListItem>
        </List>
      )}
    </Box>
  )
}

export default VendorDetailPage
