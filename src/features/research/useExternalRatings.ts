import { useEffect, useState } from "react"
import { loadCachedExternalRatings } from "../../data/scoringRepository"
import { displayError } from "../../lib/displayError"
import type { ExternalRatingObservation } from "./scoringTypes"

export function useExternalRatings(securityId: string) {
  const [loaded, setLoaded] = useState<{ securityId: string; data: readonly ExternalRatingObservation[]; error: string | null } | null>(null)
  useEffect(() => {
    let active = true
    void loadCachedExternalRatings(securityId).then(data => { if (active) setLoaded({ securityId, data, error: null }) }).catch((reason: unknown) => { if (active) setLoaded({ securityId, data: [], error: displayError(reason) }) })
    return () => { active = false }
  }, [securityId])
  return loaded?.securityId === securityId ? { ...loaded, isLoading: false } : { data: [], error: null, isLoading: true }
}
