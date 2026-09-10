import { useEffect, useState } from "react"
import { loadProviderQuotaSummary, type ProviderQuotaSummary } from "../../data/providerQuotaRepository"
import { displayError } from "../../lib/displayError"

export function useProviderQuotaSummary() {
  const [data, setData] = useState<ProviderQuotaSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void loadProviderQuotaSummary()
      .then((value) => { if (active) setData(value) })
      .catch((reason: unknown) => { if (active) setError(displayError(reason)) })
    return () => { active = false }
  }, [])

  return { data, error, isLoading: !data && !error }
}
