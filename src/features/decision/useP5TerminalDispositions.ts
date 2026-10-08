import { useEffect, useMemo, useState } from "react"
import {
  loadP5TerminalDispositions,
  type P5TerminalDisposition,
} from "../../data/p5TerminalDispositionRepository"
import { displayError } from "../../lib/displayError"

export function useP5TerminalDispositions(portfolioId: string | null) {
  const [state, setState] = useState<{
    readonly portfolioId: string
    readonly data: readonly P5TerminalDisposition[]
    readonly error: string | null
  } | null>(null)

  useEffect(() => {
    let active = true
    if (!portfolioId) return () => { active = false }

    void loadP5TerminalDispositions(portfolioId)
      .then((data) => {
        if (active) setState({ portfolioId, data, error: null })
      })
      .catch((reason: unknown) => {
        if (active) setState({ portfolioId, data: [], error: displayError(reason) })
      })

    return () => { active = false }
  }, [portfolioId])

  const data = useMemo(
    () => state?.portfolioId === portfolioId ? state.data : [],
    [portfolioId, state],
  )
  const bySecurityId = useMemo(
    () => new Map(data.map((row) => [row.securityId, row] as const)),
    [data],
  )

  return {
    data,
    bySecurityId,
    error: state?.portfolioId === portfolioId ? state.error : null,
    isLoading: Boolean(portfolioId) && state?.portfolioId !== portfolioId,
  }
}
