import { useMemo } from "react"
import type { PortfolioViewModel } from "../portfolio/types"
import { useResearchCoverage } from "../research/useResearchCoverage"
import { useDashboardMonitoringSettings } from "../dashboard/useDashboardEvidence"
import { useP5TerminalDispositions } from "./useP5TerminalDispositions"
import {
  buildProgramCR10LiveActionCenter,
  type ProgramCR10MonitoringInput,
} from "./r10LiveActionCenter"

export function useProgramCR10ActionCenter(
  portfolio: PortfolioViewModel | null,
) {
  const positions = useMemo(
    () => portfolio?.openPositions ?? [],
    [portfolio],
  )
  const securityIds = useMemo(
    () => positions.map((position) => position.securityId),
    [positions],
  )
  const coverage = useResearchCoverage(positions)
  const p5 = useP5TerminalDispositions(portfolio?.portfolio.id ?? null)
  const monitoring = useDashboardMonitoringSettings(
    portfolio?.portfolio.id ?? null,
    securityIds,
  )

  const monitoringInputs = useMemo(() => {
    const map = new Map<string, ProgramCR10MonitoringInput>()
    for (const [securityId, row] of monitoring.data.entries()) {
      map.set(securityId, {
        targetPrice: row.targetPrice,
        stopLossPrice: row.stopLossPrice,
        targetPriceAlertEnabled: row.targetPriceAlertEnabled,
        stopLossAlertEnabled: row.stopLossAlertEnabled,
      })
    }
    return map
  }, [monitoring.data])

  const data = useMemo(
    () => (
      portfolio && !coverage.isLoading && !monitoring.isLoading && !p5.isLoading
        ? buildProgramCR10LiveActionCenter(
            portfolio,
            coverage.data,
            monitoringInputs,
            p5.bySecurityId,
          )
        : null
    ),
    [coverage.data, coverage.isLoading, monitoring.isLoading, monitoringInputs, p5.bySecurityId, p5.isLoading, portfolio],
  )

  return {
    data,
    isLoading: coverage.isLoading || monitoring.isLoading || p5.isLoading,
    error: coverage.error ?? monitoring.error ?? p5.error,
  }
}
