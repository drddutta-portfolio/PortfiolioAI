import { useEffect, useMemo, useState } from "react"
import { loadProviderOperationalSummary, loadResearchCoverageEvidence, type ProviderOperationalSummary } from "../../data/researchCoverageRepository"
import { displayError } from "../../lib/displayError"
import type { PortfolioPosition } from "../portfolio/types"
import { buildResearchCoverage, type ResearchCoverageRow } from "./researchCoverage"

export function useResearchCoverage(positions: readonly PortfolioPosition[]) {
  const securityIds = useMemo(() => positions.map((position) => position.securityId), [positions])
  const key = securityIds.join(":")
  const [state, setState] = useState<{ readonly key: string; readonly data: readonly ResearchCoverageRow[]; readonly error: string | null } | null>(null)

  useEffect(() => {
    let active = true
    if (securityIds.length) {
      void loadResearchCoverageEvidence(securityIds)
        .then((evidence) => {
          if (active) setState({ key, data: buildResearchCoverage(positions, evidence.observations, evidence.documents, evidence.identities, evidence.enrichment), error: null })
        })
        .catch((reason: unknown) => { if (active) setState({ key, data: [], error: displayError(reason) }) })
    }
    return () => { active = false }
  }, [key, positions, securityIds])

  if (!securityIds.length) return { data: [] as readonly ResearchCoverageRow[], error: null, isLoading: false }
  return {
    data: state?.key === key ? state.data : [],
    error: state?.key === key ? state.error : null,
    isLoading: state?.key !== key,
  }
}

export function useProviderOperationalSummary() {
  const [data, setData] = useState<ProviderOperationalSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void loadProviderOperationalSummary()
      .then((value) => { if (active) setData(value) })
      .catch((reason: unknown) => { if (active) setError(displayError(reason)) })
    return () => { active = false }
  }, [])
  return { data, error, isLoading: !data && !error }
}
