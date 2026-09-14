export const PHARMA_HISTORY_METRIC_DEFINITIONS_VERSION = "PHARMA_HISTORY_METRIC_DEFINITIONS_V1" as const

export interface ProposedPharmaHistoryMetricDefinition {
  readonly code: string
  readonly name: string
  readonly valueKind: "NUMERIC"
  readonly canonicalUnit: "INR_CRORE" | "PERCENT"
  readonly statementScope: "INCOME_STATEMENT" | "RATIO"
  readonly periodType: "YEAR" | "QUARTER"
  readonly calculationOwner: "TRENDLYNE_MCP" | "PORTFOLIOAI"
  readonly providerLabels: readonly string[]
  readonly definitionRequiredInProduction: boolean
}

/**
 * R4H repository contract only. These definitions describe the minimum new
 * canonical metric identities required for the pilot without abusing TTM
 * metrics. Raw quarterly profit/revenue remain in retained source records; only
 * the PortfolioAI-derived quarterly OPM needs a canonical derived metric.
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
    code: "OPM_QUARTER_DERIVED",
    name: "Operating profit margin quarterly — PortfolioAI derived",
    valueKind: "NUMERIC",
    canonicalUnit: "PERCENT",
    statementScope: "RATIO",
    periodType: "QUARTER",
    calculationOwner: "PORTFOLIOAI",
    providerLabels: [],
    definitionRequiredInProduction: true,
  },
] as const

export function proposedPharmaHistoryMetric(code: string) {
  return PROPOSED_PHARMA_HISTORY_METRIC_DEFINITIONS.find((item) => item.code === code) ?? null
}
