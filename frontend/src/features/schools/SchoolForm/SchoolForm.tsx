import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import type { NewSchool } from "../../../api/client"

interface SchoolFormProps {
  form: NewSchool
  setForm: (form: NewSchool) => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  onCancel?: () => void
}

// Shared by SchoolsPage (add/edit in the list) and SchoolDetailPage (edit
// from the drill-down view).
const SchoolForm = ({ form, setForm, onSubmit, submitLabel, onCancel }: SchoolFormProps) => {
  const { t } = useTranslation()

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}
    >
      <TextField
        label={t("schools.fields.name")}
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <TextField
        label={t("schools.fields.arrivalTime")}
        type="time"
        value={form.arrival_time}
        onChange={(e) => setForm({ ...form, arrival_time: e.target.value })}
      />
      <TextField
        label={t("schools.fields.departureTime")}
        type="time"
        value={form.departure_time}
        onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
      />
      <Stack direction="row" spacing={1} sx={{ gridColumn: "1 / -1" }}>
        <Button type="submit" variant="contained">
          {submitLabel}
        </Button>
        {onCancel && <Button onClick={onCancel}>{t("common.cancel")}</Button>}
      </Stack>
    </Box>
  )
}

export default SchoolForm
