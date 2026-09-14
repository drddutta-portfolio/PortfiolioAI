import { useEffect, useState } from "react"
import { loadSecurityEnrichment } from "../../data/enrichmentRepository"
import { supabaseMarketPriceProvider } from "../../data/marketDataRepository"
import { loadPortfolioLedgerSnapshot } from "../../data/portfolioRepository"
import { displayError } from "../../lib/displayError"
import { calculatePortfolio } from "./calculatePortfolio"
import { applySharedClassification } from "./sharedClassification"
import type { PortfolioViewModel } from "./types"

export function usePortfolioView() {
  const [portfolio, setPortfolio] = useState<PortfolioViewModel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    void loadPortfolioLedgerSnapshot(supabaseMarketPriceProvider).then(async (snapshot) => {
      const calculated = calculatePortfolio(snapshot)
      const securityIds = [...new Set([
        ...calculated.openPositions.map((position) => position.securityId),
        ...calculated.closedPositions.map((position) => position.securityId),
      ])]
      const enrichments = await loadSecurityEnrichment(securityIds)
      if (active) setPortfolio(applySharedClassification(calculated, enrichments))
    }).catch((loadError: unknown) => {
      if (active) setError(displayError(loadError))
    }).finally(() => {
      if (active) setIsLoading(false)
    })
    return () => { active = false }
  }, [revision])
  return {
    portfolio,
    error,
    isLoading,
    reload: () => {
      setIsLoading(true)
      setError(null)
      setRevision((value) => value + 1)
    },
  }
}
