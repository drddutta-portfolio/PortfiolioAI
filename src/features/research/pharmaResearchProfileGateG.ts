import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import type { ResearchMetricContract, ResearchProfileContract } from "./researchProfileContract"

export const PHARMA_RESEARCH_PROFILE_GATE_G_VERSION =
  "PHARMA_V1_GATE_G_DIMENSIONS_V1" as const

const DIMENSION_RECONCILIATION = {
  PHARMA_ROCE_HISTORY: "CAPITAL_EFFICIENCY",
  PHARMA_CASH_CONVERSION_HISTORY: "CASH_FLOW",
  PHARMA_BALANCE_SHEET_LEVERAGE: "BALANCE_SHEET_CREDIT",
  PHARMA_OWNERSHIP_GOVERNANCE: "OWNERSHIP_GOVERNANCE",
} as const

type ReconciledMetricCode = keyof typeof DIMENSION_RECONCILIATION

function reconcileMetric(metric: ResearchMetricContract): ResearchMetricContract {
  const dimension =
    DIMENSION_RECONCILIATION[metric.metricCode as ReconciledMetricCode]
  return dimension ? { ...metric, dimension } : metric
}

export const PHARMA_RESEARCH_PROFILE_GATE_G = {
  profileCode: "PHARMA",
  profileVersion: PHARMA_RESEARCH_PROFILE_GATE_G_VERSION,
  displayName: "Pharmaceuticals",
  metrics: PHARMA_RESEARCH_PROFILE_V1.metrics.map(reconcileMetric),
} as const satisfies ResearchProfileContract

export const PHARMA_GATE_G_RECONCILED_METRIC_CODES =
  Object.keys(DIMENSION_RECONCILIATION) as readonly ReconciledMetricCode[]
