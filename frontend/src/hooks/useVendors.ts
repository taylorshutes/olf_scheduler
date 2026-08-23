import { useCallback, useEffect, useState } from "react"
import {
  createVendor,
  deleteVendor,
  getVendors,
  updateVendor,
  type NewVendor,
  type Vendor,
} from "../api/client"

export const useVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    return getVendors()
      .then(setVendors)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = async (vendor: NewVendor) => {
    await createVendor(vendor)
    await refresh()
  }

  const update = async (id: number, vendor: NewVendor) => {
    await updateVendor(id, vendor)
    await refresh()
  }

  const remove = async (id: number) => {
    await deleteVendor(id)
    await refresh()
  }

  return { vendors, loading, error, refresh, create, update, remove }
}
