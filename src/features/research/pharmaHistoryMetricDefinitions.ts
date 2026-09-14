export const PHARMA_HISTORY_METRIC_DEFINITIONS_VERSION = "PHARMA_HISTORY_METRIC_DEFINITIONS_V2" as const

export interface ProposedPharmaHistoryMetricDefinition {
  readonly code: string
  readonly name: string
  readonly valueKind: "NUMERIC"
  readonly canonicalUnit: "INR_CRORE"
  readonly statementScope: "INCOME_STATEMENT"
  readonly periodType: "YEAR" | "QUARTER"
  readonly calculationOwner: "TRENDLYNE_MCP"
  readonly providerLabels: readonly string[]
  readonly definitionRequiredInProduction: boolean
}

/**
 * R4H repository contract only. These are the new raw-evidence identities
 * required by the TORNTPHARM pilot. Quarterly OPM is intentionally NOT a
 * fundamental provider observation: PortfolioAI derives it downstream from the
 * matched raw operating-profit and operating-revenue observations.
 */
export const PROPOSED_PHARMA_HISTORY_METRIC_DEFINITIONS: readonly ProposedPharmaHistoryMetricDefinition[] = [
  {
    code: "REVENUE_ANNUAL",
    name: "Operating revenue annual",
    valueKind: "NUMERIC",
    canonicalUnit: "INR_CRORE",
    statementScope: "INCOME_STATEMENT",
    periodType: "YEAR",
    calculationOwner: "TRENDLYNE_MCP",
    providerLabels: ["Operating Rev. Ann.", "Operating Rev. Ann. 1Y Ago", "Operating Rev. Ann. 2Y Ago", "Operating Rev. Ann. 3Y Ago", "Operating Rev. Ann. 4Y Ago", "Operating Rev. Ann. 5Y Ago"],
    definitionRequiredInProduction: true,
  },
  {
    code: "OPERATING_REVENUE_QUARTER",
    name: "Operating revenue quarterly",
    valueKind: "NUMERIC",
    canonicalUnit: "INR_CRORE",
    statementScope: "INCOME_STATEMENT",
    periodType: "QUARTER",
    calculationOwner: "TRENDLYNE_MCP",
    providerLabels: ["Operating Rev. Qtr", "Operating Rev. 1Q ago", "Operating Rev. 2Q ago", "Operating Rev. 3Q ago", "Operating Rev. 4Q ago", "Operating Rev. 5Q ago", "Operating Rev. 6Q ago", "Operating Rev. 7Q ago", "Operating Rev. 8Q ago"],
    definitionRequiredInProduction: true,
  },
  {
    code: "OPERATING_PROFIT_QUARTER",
    name: "Operating profit quarterly",
    valueKind: "NUMERIC",
    canonicalUnit: "INR_CRORE",
    statementScope: "INCOME_STATEMENT",
    periodType: "QUARTER",
    calculationOwner: "TRENDLYNE_MCP",
    providerLabels: ["Operating Profit Qtr", "Operating Profit 1Q Ago", "Operating Profit 2Q Ago", "Operating Profit 3Q Ago", "Operating Profit 4Q Ago", "Operating Profit 5Q Ago", "Operating Profit 5Qtr Ago", "Operating Profit 6Q Ago", "Operating Profit 6Qtr Ago", "Operating Profit 7Q Ago", "Operating Profit 7Qtr Ago", "Operating Profit 8Q Ago", "Operating Profit 8Qtr Ago"],
    definitionRequiredInProduction: true,
  },
] as const

export function proposedPharmaHistoryMetric(code: string) {
  return PROPOSED_PHARMA_HISTORY_METRIC_DEFINITIONS.find((item) => item.code === code) ?? null
}
