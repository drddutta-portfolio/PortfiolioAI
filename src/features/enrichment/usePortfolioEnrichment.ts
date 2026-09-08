import { useEffect, useMemo, useState } from "react"
import { loadSecurityEnrichment } from "../../data/enrichmentRepository"
import { displayError } from "../../lib/displayError"
import { aggregateEnrichmentState } from "./enrichmentPolicy"
import type { EnrichmentLoadResult, SecurityEnrichment } from "./types"

const empty: ReadonlyMap<string, SecurityEnrichment> = new Map()

export function usePortfolioEnrichment(securityIds: readonly string[]): EnrichmentLoadResult {
  const key = useMemo(() => [...new Set(securityIds)].sort().join(","), [securityIds])
  const [loaded, setLoaded] = useState<{ readonly key: string; readonly result: EnrichmentLoadResult }>({ key: "", result: { bySecurityId: empty, state: "LOADING", error: null } })
  useEffect(() => {
    let active = true
    const ids = key ? key.split(",") : []
    if (!ids.length) return () => { active = false }
    void loadSecurityEnrichment(ids).then((bySecurityId) => {
      if (!active) return
      const states = [...bySecurityId.values()].map((item) => item.state)
      const state = aggregateEnrichmentState(states, bySecurityId.size === ids.length)
      setLoaded({ key, result: { bySecurityId, state, error: null } })
    }).catch((error: unknown) => { if (active) setLoaded({ key, result: { bySecurityId: empty, state: "FAILED", error: displayError(error) } }) })
    return () => { active = false }
  }, [key])
  if (!key) return { bySecurityId: empty, state: "UNAVAILABLE", error: null }
  return loaded.key === key ? loaded.result : { bySecurityId: empty, state: "LOADING", error: null }
}
