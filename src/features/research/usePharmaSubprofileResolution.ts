import { useEffect, useMemo, useState } from "react"
import { loadPharmaSubprofileResolution } from "../../data/researchSubprofileRepository"
import { displayError } from "../../lib/displayError"
import type { PharmaSubprofileResolution } from "./pharmaSubprofileAssignment"

interface ResolutionLoadState {
  readonly securityId: string
  readonly data: PharmaSubprofileResolution | null
  readonly error: string | null
}

export function usePharmaSubprofileResolution(securityId: string | null) {
  const evaluationDate = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [state, setState] = useState<ResolutionLoadState | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    if (!securityId) return () => { active = false }

    void loadPharmaSubprofileResolution(securityId, evaluationDate)
      .then((resolution) => {
        if (active) setState({ securityId, data: resolution, error: null })
      })
      .catch((reason: unknown) => {
        if (active) setState({ securityId, data: null, error: displayError(reason) })
      })

    return () => { active = false }
  }, [securityId, evaluationDate, revision])

  const current = securityId && state?.securityId === securityId ? state : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    isLoading: Boolean(securityId) && current === null,
    reload: () => setRevision((value) => value + 1),
  }
}
