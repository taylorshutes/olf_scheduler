import { useTranslation } from "react-i18next"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import MenuItem from "@mui/material/MenuItem"
import FormControlLabel from "@mui/material/FormControlLabel"
import Checkbox from "@mui/material/Checkbox"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import { WORKSHOP_TYPES, type VendorFormState } from "../vendorFormUtils"

interface VendorFormProps {
  form: VendorFormState
  setForm: (form: VendorFormState) => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  onCancel?: () => void
}

// Shared by VendorsPage (add/edit in the list) and VendorDetailPage (edit
// from the drill-down view) so the field set only exists in one place.
const VendorForm = ({ form, setForm, onSubmit, submitLabel, onCancel }: VendorFormProps) => {
  const { t } = useTranslation()

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}
    >
      <TextField
        label={t("vendors.fields.name")}
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <TextField
        label={t("vendors.fields.availableStart")}
        type="time"
        value={form.available_start}
        onChange={(e) => setForm({ ...form, available_start: e.target.value })}
      />
      <TextField
        label={t("vendors.fields.availableEnd")}
        type="time"
        value={form.available_end}
        onChange={(e) => setForm({ ...form, available_end: e.target.value })}
      />
      <TextField
        label={t("vendors.fields.sessionDuration")}
        type="number"
        value={form.session_duration}
        onChange={(e) => setForm({ ...form, session_duration: e.target.value })}
      />
      <TextField
        label={t("vendors.fields.capacityPerSession")}
        type="number"
        value={form.capacity_per_session}
        onChange={(e) => setForm({ ...form, capacity_per_session: e.target.value })}
      />
      <TextField
        label={t("vendors.fields.tags")}
        placeholder={t("vendors.fields.tagsPlaceholder")}
        value={form.tags}
        onChange={(e) => setForm({ ...form, tags: e.target.value })}
      />
      <TextField
        select
        label={t("vendors.fields.workshopType")}
        value={form.workshop_type}
        onChange={(e) => setForm({ ...form, workshop_type: e.target.value })}
      >
        <MenuItem value="">{t("vendors.fields.workshopTypeNone")}</MenuItem>
        {WORKSHOP_TYPES.map((type) => (
          <MenuItem key={type} value={type}>
            {t(`vendors.workshopTypes.${type}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={t("vendors.fields.targetAges")}
        placeholder={t("vendors.fields.targetAgesPlaceholder")}
        value={form.target_ages}
        onChange={(e) => setForm({ ...form, target_ages: e.target.value })}
      />
      <TextField
        label={t("vendors.fields.excludedAges")}
        placeholder={t("vendors.fields.excludedAgesPlaceholder")}
        value={form.excluded_ages}
        onChange={(e) => setForm({ ...form, excluded_ages: e.target.value })}
      />
      <TextField
        label={t("vendors.fields.travelTime")}
        type="number"
        value={form.travel_time}
        onChange={(e) => setForm({ ...form, travel_time: e.target.value })}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={form.wants_break}
            onChange={(e) => setForm({ ...form, wants_break: e.target.checked })}
          />
        }
        label={t("vendors.fields.wantsBreak")}
      />
      <TextField
        label={t("vendors.fields.breakDuration")}
        type="number"
        value={form.break_duration}
        onChange={(e) => setForm({ ...form, break_duration: e.target.value })}
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

export default VendorForm
