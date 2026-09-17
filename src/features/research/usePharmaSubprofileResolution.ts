import { useEffect, useMemo, useState } from "react"
import { loadPharmaSubprofileResolution } from "../../data/researchSubprofileRepository"
import { displayError } from "../../lib/displayError"
import type { PharmaSubprofileResolution } from "./pharmaSubprofileAssignment"

export function usePharmaSubprofileResolution(securityId: string | null) {
  const evaluationDate = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [data, setData] = useState<PharmaSubprofileResolution | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    if (!securityId) {
      setData(null)
      setError(null)
      return () => { active = false }
    }

    setData(null)
    setError(null)
    void loadPharmaSubprofileResolution(securityId, evaluationDate)
      .then((resolution) => { if (active) setData(resolution) })
      .catch((reason: unknown) => { if (active) setError(displayError(reason)) })

    return () => { active = false }
  }, [securityId, evaluationDate, revision])

  return {
    data,
    error,
    isLoading: Boolean(securityId) && !data && !error,
    reload: () => setRevision((value) => value + 1),
  }
}
