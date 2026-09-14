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
 * R4H repository contract only. These definitions describe the canonical metric
 * identities required to store PHARMA history without abusing TTM metrics.
 * They do not create database rows; a versioned migration remains separately
 * gated before production ingestion.
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
    providerLabels: ["Operating Rev. Ann.", "Total Rev. Ann. 1Y Ago", "Rev. Ann. 1Y ago", "Rev. Ann. 2Y ago", "Rev. Ann. 3Y ago", "Rev. Ann. 4Y ago", "Rev. Ann. 5Y ago"],
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
    providerLabels: ["Operating Profit Qtr", "Operating Profit 1Q Ago", "Operating Profit 2Q Ago", "Operating Profit 3Q Ago", "Operating Profit 4Q Ago", "Operating Profit 5Q Ago", "Operating Profit 6Q Ago", "Operating Profit 7Q Ago", "Operating Profit 8Q Ago"],
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
