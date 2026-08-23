import { useCallback, useEffect, useState } from "react"
import {
  createSchool,
  deleteSchool,
  getSchools,
  updateSchool,
  type NewSchool,
  type School,
} from "../api/client"

export const useSchools = () => {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    return getSchools()
      .then(setSchools)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = async (school: NewSchool) => {
    const created = await createSchool(school)
    await refresh()
    return created
  }

  const update = async (id: number, school: NewSchool) => {
    await updateSchool(id, school)
    await refresh()
  }

  const remove = async (id: number) => {
    await deleteSchool(id)
    await refresh()
  }

  return { schools, loading, error, refresh, create, update, remove }
}
