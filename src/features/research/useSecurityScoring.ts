import { useEffect, useState } from "react"
import { loadSecurityScoringSnapshot } from "../../data/scoringRepository"
import { displayError } from "../../lib/displayError"
import type { SecurityScoringSnapshot } from "./scoringTypes"

export function useSecurityScoring(securityId: string | null, sector: string | null, industry: string | null) {
  const [data, setData] = useState<SecurityScoringSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    if (!securityId) return () => { active = false }
    setError(null)
    void loadSecurityScoringSnapshot(securityId, sector, industry)
      .then((value) => { if (active) setData(value) })
      .catch((reason: unknown) => { if (active) setError(displayError(reason)) })
    return () => { active = false }
  }, [securityId, sector, industry, revision])
  return {
    data,
    error,
    isLoading: Boolean(securityId) && !data && !error,
    reload: () => setRevision(value => value + 1),
  }
}
