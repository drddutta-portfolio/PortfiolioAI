import { useEffect, useMemo, useState } from "react"
import { loadP7CurrentEvidenceSnapshots } from "../../data/p7CurrentIntelligenceRepository"
import { displayError } from "../../lib/displayError"
import { projectP7Ic6CurrentState, type P7Ic6CurrentProjection } from "./p7Ic6CurrentProjection"

interface State { readonly portfolioId: string; readonly data: readonly P7Ic6CurrentProjection[]; readonly error: string | null }

export function useP7CurrentIntelligence(portfolioId: string | null) {
  const [state, setState] = useState<State | null>(null)
  useEffect(() => {
    let active = true
    if (!portfolioId) return () => { active = false }
    void loadP7CurrentEvidenceSnapshots(portfolioId)
      .then((rows) => { if (active) setState({ portfolioId, data: rows.map(projectP7Ic6CurrentState), error: null }) })
      .catch((reason: unknown) => { if (active) setState({ portfolioId, data: [], error: displayError(reason) }) })
    return () => { active = false }
  }, [portfolioId])
  return useMemo(() => ({
    data: state?.portfolioId === portfolioId ? state.data : [],
    error: state?.portfolioId === portfolioId ? state.error : null,
    isLoading: Boolean(portfolioId) && state?.portfolioId !== portfolioId,
  }), [portfolioId, state])
}
