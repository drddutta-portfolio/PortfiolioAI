import { useEffect, useState } from "react"
import { loadSecurityResearch } from "../../data/researchRepository"
import { displayError } from "../../lib/displayError"
import type { SecurityResearch } from "./types"

export function useSecurityResearch(securityId: string | null) {
  const [data, setData] = useState<SecurityResearch | null>(null)
  const [error, setError] = useState<{ readonly securityId: string; readonly message: string } | null>(null)
  useEffect(() => {
    let active = true
    if (!securityId) return () => { active = false }
    void loadSecurityResearch(securityId).then((value) => { if (active) setData(value) })
      .catch((reason: unknown) => { if (active) setError({ securityId, message: displayError(reason) }) })
    return () => { active = false }
  }, [securityId])
  return {
    data: data?.securityId === securityId ? data : null,
    error: error?.securityId === securityId ? error.message : null,
    isLoading: Boolean(securityId) && data?.securityId !== securityId && error?.securityId !== securityId,
  }
}
