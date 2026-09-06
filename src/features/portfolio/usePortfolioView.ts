import { useEffect, useState } from "react"
import { loadPortfolioLedgerSnapshot } from "../../data/portfolioRepository"
import { displayError } from "../../lib/displayError"
import { calculatePortfolio } from "./calculatePortfolio"
import type { PortfolioViewModel } from "./types"

export function usePortfolioView() {
  const [portfolio, setPortfolio] = useState<PortfolioViewModel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    let active = true
    void loadPortfolioLedgerSnapshot().then((snapshot) => {
      if (active) setPortfolio(calculatePortfolio(snapshot))
    }).catch((loadError: unknown) => {
      if (active) setError(displayError(loadError))
    }).finally(() => {
      if (active) setIsLoading(false)
    })
    return () => { active = false }
  }, [])
  return { portfolio, error, isLoading }
}
