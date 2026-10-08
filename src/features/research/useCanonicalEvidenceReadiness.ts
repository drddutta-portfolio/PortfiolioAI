import { useEffect, useState } from "react"
import { loadP7CurrentEvidenceDetails, type P7CurrentEvidenceDetails } from "../../data/p7CurrentIntelligenceRepository"
import { displayError } from "../../lib/displayError"

export function useCanonicalEvidenceReadiness(portfolioId: string, securityId: string, assetClass: string, enabled = true) {
  const key = `${portfolioId}:${securityId}:${assetClass}`
  const applicable = assetClass === "EQUITY"
  const [revision, setRevision] = useState(0)
  const [loaded, setLoaded] = useState<{ key: string; revision: number; data: P7CurrentEvidenceDetails | null; error: string | null } | null>(null)
  const current = loaded?.key === key && loaded.revision === revision ? loaded : null
  useEffect(() => {
    let active = true
    if (!enabled || !applicable || !portfolioId || !securityId) return () => { active = false }
    void loadP7CurrentEvidenceDetails(portfolioId, securityId)
      .then(data => { if (active) setLoaded({ key, revision, data, error: null }) })
      .catch((reason: unknown) => { if (active) setLoaded({ key, revision, data: null, error: displayError(reason) }) })
    return () => { active = false }
  }, [key, applicable, portfolioId, securityId, enabled, revision])
  return { applicable, data: current?.data ?? null, error: current?.error ?? null, isLoading: enabled && applicable && Boolean(portfolioId && securityId) && !current, reload: () => setRevision(value => value + 1) }
}

export type CanonicalEvidenceReadiness = ReturnType<typeof useCanonicalEvidenceReadiness>
