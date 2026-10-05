import { useEffect, useState } from "react"
import { loadP7CurrentEvidenceDetails, type P7CurrentEvidenceDetails } from "../../data/p7CurrentIntelligenceRepository"
import { displayError } from "../../lib/displayError"

export function useCanonicalEvidenceReadiness(portfolioId: string, securityId: string, assetClass: string) {
  const key = `${portfolioId}:${securityId}:${assetClass}`
  const applicable = assetClass === "EQUITY"
  const [loaded, setLoaded] = useState<{ key: string; data: P7CurrentEvidenceDetails | null; error: string | null } | null>(null)
  const current = loaded?.key === key ? loaded : null
  useEffect(() => {
    let active = true
    if (!applicable) return () => { active = false }
    void loadP7CurrentEvidenceDetails(portfolioId, securityId)
      .then(data => { if (active) setLoaded({ key, data, error: null }) })
      .catch((reason: unknown) => { if (active) setLoaded({ key, data: null, error: displayError(reason) }) })
    return () => { active = false }
  }, [key, applicable, portfolioId, securityId])
  return { applicable, data: current?.data ?? null, error: current?.error ?? null, isLoading: applicable && !current }
}
