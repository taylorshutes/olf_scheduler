import { useState } from "react"
import { useTranslation } from "react-i18next"
import { PageHeader, AlertBanner, EntityTable, type EntityTableColumn } from "../../components"
import { useSchools } from "../../hooks/useSchools"
import type { SolveState } from "../../hooks/useSolve"
import type { School } from "../../api/client"
import SchoolForm from "./SchoolForm"
import { EMPTY_SCHOOL_FORM, schoolToForm } from "./schoolFormUtils"

interface SchoolsPageProps {
  solve: SolveState
}

const SchoolsPage = ({ solve }: SchoolsPageProps) => {
  const { t } = useTranslation()
  const { schools, loading, error, create, update, remove } = useSchools()
  const [form, setForm] = useState(EMPTY_SCHOOL_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const columns: EntityTableColumn<School>[] = [
    { header: t("schools.columns.name"), render: (s) => s.name },
    { header: t("schools.columns.arrival"), render: (s) => s.arrival_time },
    { header: t("schools.columns.departure"), render: (s) => s.departure_time },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    try {
      if (editingId != null) {
        await update(editingId, form)
      } else {
        await create(form)
      }
      solve.clear()
      setForm(EMPTY_SCHOOL_FORM)
      setEditingId(null)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleEdit = (s: School) => {
    setForm(schoolToForm(s))
    setEditingId(s.id)
  }

  const handleCancelEdit = () => {
    setForm(EMPTY_SCHOOL_FORM)
    setEditingId(null)
  }

  const handleDelete = async (s: School) => {
    setFormError(null)
    try {
      await remove(s.id)
      solve.clear()
      if (editingId === s.id) handleCancelEdit()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <>
      <PageHeader>{t("schools.title")}</PageHeader>
      <AlertBanner message={error ?? formError} />

      <SchoolForm
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitLabel={editingId != null ? t("common.save") : t("schools.addButton")}
        onCancel={editingId != null ? handleCancelEdit : undefined}
      />

      {!loading && (
        <EntityTable
          columns={columns}
          rows={schools}
          getRowKey={(s) => s.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}

export default SchoolsPage
