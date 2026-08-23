import { useCallback, useEffect, useState } from "react"
import {
  createClass,
  deleteClass,
  getClasses,
  updateClass,
  type NewSchoolClass,
  type SchoolClass,
} from "../api/client"

export const useClasses = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    return getClasses()
      .then(setClasses)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = async (cls: NewSchoolClass) => {
    await createClass(cls)
    await refresh()
  }

  const update = async (id: number, cls: NewSchoolClass) => {
    await updateClass(id, cls)
    await refresh()
  }

  const remove = async (id: number) => {
    await deleteClass(id)
    await refresh()
  }

  return { classes, loading, error, refresh, create, update, remove }
}
