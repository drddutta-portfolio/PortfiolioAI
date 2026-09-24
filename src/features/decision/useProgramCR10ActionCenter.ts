import { useMemo } from "react"
import type { PortfolioViewModel } from "../portfolio/types"
import { useResearchCoverage } from "../research/useResearchCoverage"
import { useDashboardMonitoringSettings } from "../dashboard/useDashboardEvidence"
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
      portfolio && !coverage.isLoading && !monitoring.isLoading
        ? buildProgramCR10LiveActionCenter(
            portfolio,
            coverage.data,
            monitoringInputs,
          )
        : null
    ),
    [coverage.data, coverage.isLoading, monitoring.isLoading, monitoringInputs, portfolio],
  )

  return {
    data,
    isLoading: coverage.isLoading || monitoring.isLoading,
    error: coverage.error ?? monitoring.error,
  }
}
