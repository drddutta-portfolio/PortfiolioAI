import Decimal from "decimal.js"
import type { PortfolioPosition } from "../portfolio/types"
import type { SecurityEnrichment } from "./types"

export interface EnrichmentAllocationRow { readonly label: string; readonly value: string; readonly percentage: string }

function labelFor(position: PortfolioPosition, enrichment: SecurityEnrichment | undefined, kind: "sector" | "marketCap") {
  if (position.assetClass !== "EQUITY") return "ETF / non-equity"
  if (kind === "sector") return enrichment?.sector ?? "Unclassified"
  if (enrichment?.marketCapCategory === "LARGE_CAP") return "Large cap"
  if (enrichment?.marketCapCategory === "MID_CAP") return "Mid cap"
  if (enrichment?.marketCapCategory === "SMALL_CAP") return "Small cap"
  return enrichment?.marketCapCategory === "CONFLICTING" ? "Conflicting evidence" : "Unavailable"
}

export function enrichmentAllocation(
  positions: readonly PortfolioPosition[],
  enrichments: ReadonlyMap<string, SecurityEnrichment>,
  kind: "sector" | "marketCap",
): readonly EnrichmentAllocationRow[] {
  const priced = positions.filter((position) => position.currentValue !== null)
  const denominator = priced.reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
  if (denominator.isZero()) return []
  const groups = new Map<string, Decimal>()
  priced.forEach((position) => {
    const label = labelFor(position, enrichments.get(position.securityId), kind)
    groups.set(label, (groups.get(label) ?? new Decimal(0)).plus(position.currentValue ?? "0"))
  })
  return [...groups.entries()].map(([label, value]) => ({ label, value: value.toFixed(), percentage: value.div(denominator).times(100).toFixed() }))
    .sort((left, right) => new Decimal(right.percentage).comparedTo(left.percentage))
}
