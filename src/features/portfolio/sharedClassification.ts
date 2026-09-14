import type { SecurityEnrichment } from "../enrichment/types"
import type { PortfolioPosition, PortfolioViewModel } from "./types"

function classifyPosition(position: PortfolioPosition, enrichments: ReadonlyMap<string, SecurityEnrichment>): PortfolioPosition {
  const enrichment = enrichments.get(position.securityId)
  if (!enrichment) return position
  return {
    ...position,
    sector: enrichment.sector,
    industry: enrichment.industry,
  }
}

/**
 * Applies the same reviewed classification projection used by Dashboard
 * Allocation & performance to every portfolio position before application pages
 * consume the portfolio view model.
 *
 * `current_security_enrichment_v1` remains the data authority; this function only
 * overlays its already-loaded values onto the shared view model.
 */
export function applySharedClassification(
  portfolio: PortfolioViewModel,
  enrichments: ReadonlyMap<string, SecurityEnrichment>,
): PortfolioViewModel {
  return {
    ...portfolio,
    openPositions: portfolio.openPositions.map((position) => classifyPosition(position, enrichments)),
    closedPositions: portfolio.closedPositions.map((position) => classifyPosition(position, enrichments)),
  }
}
