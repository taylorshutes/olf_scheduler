import { useState } from "react"
import { useTranslation } from "react-i18next"
import { PageHeader, AlertBanner, EntityTable, type EntityTableColumn } from "../../components"
import { useVendors } from "../../hooks/useVendors"
import type { SolveState } from "../../hooks/useSolve"
import type { Vendor } from "../../api/client"
import VendorForm from "./VendorForm"
import { EMPTY_VENDOR_FORM, formToVendor, vendorToForm } from "./vendorFormUtils"

interface VendorsPageProps {
  solve: SolveState
}

const VendorsPage = ({ solve }: VendorsPageProps) => {
  const { t } = useTranslation()
  const { vendors, loading, error, create, update, remove } = useVendors()
  const [form, setForm] = useState(EMPTY_VENDOR_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const columns: EntityTableColumn<Vendor>[] = [
    { header: t("vendors.columns.name"), render: (v) => v.name },
    { header: t("vendors.columns.hours"), render: (v) => `${v.available_start}–${v.available_end}` },
    { header: t("vendors.columns.session"), render: (v) => `${v.session_duration} min` },
    { header: t("vendors.columns.capacity"), render: (v) => v.capacity_per_session },
    {
      header: t("vendors.columns.targetYearGroups"),
      render: (v) => v.target_ages.join(", ") || t("vendors.columns.any"),
    },
    { header: t("vendors.columns.excludedAges"), render: (v) => v.excluded_ages.join(", ") || "—" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    try {
      if (editingId != null) {
        await update(editingId, formToVendor(form))
      } else {
        await create(formToVendor(form))
      }
      solve.clear()
      setForm(EMPTY_VENDOR_FORM)
      setEditingId(null)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleEdit = (v: Vendor) => {
    setForm(vendorToForm(v))
    setEditingId(v.id)
  }

  const handleCancelEdit = () => {
    setForm(EMPTY_VENDOR_FORM)
    setEditingId(null)
  }

  const handleDelete = async (v: Vendor) => {
    setFormError(null)
    try {
      await remove(v.id)
      solve.clear()
      if (editingId === v.id) handleCancelEdit()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <>
      <PageHeader>{t("vendors.title")}</PageHeader>
      <AlertBanner message={error ?? formError} />

      <VendorForm
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitLabel={editingId != null ? t("common.save") : t("vendors.addButton")}
        onCancel={editingId != null ? handleCancelEdit : undefined}
      />

      {!loading && (
        <EntityTable
          columns={columns}
          rows={vendors}
          getRowKey={(v) => v.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}

export default VendorsPage
