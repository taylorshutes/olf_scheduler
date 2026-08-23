import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { PageHeader, AlertBanner, EntityTable, type EntityTableColumn } from "../../components"
import { useClasses } from "../../hooks/useClasses"
import { useSchools } from "../../hooks/useSchools"
import type { SolveState } from "../../hooks/useSolve"
import type { SchoolClass } from "../../api/client"
import ClassForm from "./ClassForm"
import { EMPTY_CLASS_FORM, NEW_SCHOOL, classToForm, formToClass } from "./classFormUtils"

interface ClassesPageProps {
  solve: SolveState
}

const ClassesPage = ({ solve }: ClassesPageProps) => {
  const { t } = useTranslation()
  const { classes, loading, error: classesError, create, update, remove } = useClasses()
  const { schools, create: createSchool } = useSchools()
  const [form, setForm] = useState(EMPTY_CLASS_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setForm((f) => (f.school_id === NEW_SCHOOL && schools.length > 0
      ? { ...f, school_id: String(schools[0].id) }
      : f))
  }, [schools])

  const columns: EntityTableColumn<SchoolClass>[] = [
    {
      header: t("classes.columns.school"),
      render: (c) => schools.find((s) => s.id === c.school_id)?.name ?? `#${c.school_id}`,
    },
    { header: t("classes.columns.name"), render: (c) => c.name },
    { header: t("classes.columns.capacity"), render: (c) => c.capacity },
    { header: t("classes.columns.yearGroups"), render: (c) => c.age_group.join(", ") },
    { header: t("classes.columns.targetWorkshops"), render: (c) => c.target_workshops },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    try {
      let schoolId: number
      if (form.school_id === NEW_SCHOOL) {
        const school = await createSchool({
          name: form.new_school_name,
          arrival_time: form.new_school_arrival,
          departure_time: form.new_school_departure,
        })
        schoolId = school.id
      } else {
        schoolId = Number(form.school_id)
      }
      if (editingId != null) {
        await update(editingId, formToClass(form, schoolId))
      } else {
        await create(formToClass(form, schoolId))
      }
      solve.clear()
      setForm({ ...EMPTY_CLASS_FORM, school_id: String(schoolId) })
      setEditingId(null)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleEdit = (c: SchoolClass) => {
    setForm(classToForm(c))
    setEditingId(c.id)
  }

  const handleCancelEdit = () => {
    setForm((f) => ({ ...EMPTY_CLASS_FORM, school_id: f.school_id }))
    setEditingId(null)
  }

  const handleDelete = async (c: SchoolClass) => {
    setFormError(null)
    try {
      await remove(c.id)
      solve.clear()
      if (editingId === c.id) handleCancelEdit()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <>
      <PageHeader>{t("classes.title")}</PageHeader>
      <AlertBanner message={classesError ?? formError} />

      <ClassForm
        form={form}
        setForm={setForm}
        schools={schools}
        onSubmit={handleSubmit}
        submitLabel={editingId != null ? t("common.save") : t("classes.addButton")}
        onCancel={editingId != null ? handleCancelEdit : undefined}
      />

      {!loading && (
        <EntityTable
          columns={columns}
          rows={classes}
          getRowKey={(c) => c.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}

export default ClassesPage
