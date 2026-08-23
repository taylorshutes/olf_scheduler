import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import MenuItem from "@mui/material/MenuItem"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import type { School } from "../../../api/client"
import { NEW_SCHOOL, type ClassFormState } from "../classFormUtils"

interface ClassFormProps {
  form: ClassFormState
  setForm: (form: ClassFormState) => void
  schools: School[]
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  onCancel?: () => void
}

// Shared by ClassesPage (add/edit in the list) and ClassDetailPage (edit
// from the drill-down view).
const ClassForm = ({ form, setForm, schools, onSubmit, submitLabel, onCancel }: ClassFormProps) => {
  const { t } = useTranslation()
  const addingNewSchool = form.school_id === NEW_SCHOOL

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}
    >
      <TextField
        select
        label={t("classes.fields.school")}
        value={form.school_id}
        onChange={(e) => setForm({ ...form, school_id: e.target.value })}
      >
        {schools.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.name}
          </MenuItem>
        ))}
        <MenuItem value={NEW_SCHOOL}>{t("classes.addNewSchoolOption")}</MenuItem>
      </TextField>

      {addingNewSchool && (
        <>
          <TextField
            label={t("classes.fields.newSchoolName")}
            required
            value={form.new_school_name}
            onChange={(e) => setForm({ ...form, new_school_name: e.target.value })}
          />
          <TextField
            label={t("classes.fields.arrivalTime")}
            type="time"
            value={form.new_school_arrival}
            onChange={(e) => setForm({ ...form, new_school_arrival: e.target.value })}
          />
          <TextField
            label={t("classes.fields.departureTime")}
            type="time"
            value={form.new_school_departure}
            onChange={(e) => setForm({ ...form, new_school_departure: e.target.value })}
          />
        </>
      )}

      <TextField
        label={t("classes.fields.name")}
        required
        placeholder={t("classes.fields.namePlaceholder")}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <TextField
        label={t("classes.fields.capacity")}
        type="number"
        value={form.capacity}
        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
      />
      <TextField
        label={t("classes.fields.yearGroups")}
        required
        placeholder={t("classes.fields.yearGroupsPlaceholder")}
        value={form.age_group}
        onChange={(e) => setForm({ ...form, age_group: e.target.value })}
      />
      <TextField
        label={t("classes.fields.targetWorkshops")}
        type="number"
        value={form.target_workshops}
        onChange={(e) => setForm({ ...form, target_workshops: e.target.value })}
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

export default ClassForm
