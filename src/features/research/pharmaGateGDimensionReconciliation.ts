export const PHARMA_GATE_G_DIMENSION_RECONCILIATION_VERSION =
  "PHARMA_GATE_G_DIMENSION_RECONCILIATION_V1_PROMOTED" as const

export type PharmaGateGLegacyParentDimension =
  | "QUALITY"
  | "EARNINGS_CASH_QUALITY"
  | "FINANCIAL_STRENGTH"
  | "GOVERNANCE"

export type PharmaGateGCanonicalDimension =
  | "CAPITAL_EFFICIENCY"
  | "CASH_FLOW"
  | "BALANCE_SHEET_CREDIT"
  | "OWNERSHIP_GOVERNANCE"

export interface PharmaGateGDimensionReconciliationEntry {
  readonly metricCode:
    | "PHARMA_ROCE_HISTORY"
    | "PHARMA_CASH_CONVERSION_HISTORY"
    | "PHARMA_BALANCE_SHEET_LEVERAGE"
    | "PHARMA_OWNERSHIP_GOVERNANCE"
  readonly currentParentDimension: PharmaGateGLegacyParentDimension
  readonly canonicalGateGDimension: PharmaGateGCanonicalDimension
  readonly evidenceIdentityChanges: false
  readonly evidenceProvenanceChanges: false
  readonly numericMethodologyActivated: false
}

export const PHARMA_GATE_G_DIMENSION_RECONCILIATION = {
  version: PHARMA_GATE_G_DIMENSION_RECONCILIATION_VERSION,
  state: "PROMOTED_VERSIONED_PARENT" as const,
  profileCode: "PHARMA_V1" as const,
  entries: [
    {
      metricCode: "PHARMA_ROCE_HISTORY",
      currentParentDimension: "QUALITY",
      canonicalGateGDimension: "CAPITAL_EFFICIENCY",
      evidenceIdentityChanges: false,
      evidenceProvenanceChanges: false,
      numericMethodologyActivated: false,
    },
    {
      metricCode: "PHARMA_CASH_CONVERSION_HISTORY",
      currentParentDimension: "EARNINGS_CASH_QUALITY",
      canonicalGateGDimension: "CASH_FLOW",
      evidenceIdentityChanges: false,
      evidenceProvenanceChanges: false,
      numericMethodologyActivated: false,
    },
    {
      metricCode: "PHARMA_BALANCE_SHEET_LEVERAGE",
      currentParentDimension: "FINANCIAL_STRENGTH",
      canonicalGateGDimension: "BALANCE_SHEET_CREDIT",
      evidenceIdentityChanges: false,
      evidenceProvenanceChanges: false,
      numericMethodologyActivated: false,
    },
    {
      metricCode: "PHARMA_OWNERSHIP_GOVERNANCE",
      currentParentDimension: "GOVERNANCE",
      canonicalGateGDimension: "OWNERSHIP_GOVERNANCE",
      evidenceIdentityChanges: false,
      evidenceProvenanceChanges: false,
      numericMethodologyActivated: false,
    },
  ] as const satisfies readonly PharmaGateGDimensionReconciliationEntry[],
  directInPlaceParentContractMutationAllowed: false,
  requiresVersionedParentContractPromotion: false,
  promotedParentProfileVersion: "PHARMA_V1_GATE_G_DIMENSIONS_V1" as const,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const

export function canonicalGateGDimensionForMetric(metricCode: string): string | null {
  return PHARMA_GATE_G_DIMENSION_RECONCILIATION.entries.find(
    (entry) => entry.metricCode === metricCode,
  )?.canonicalGateGDimension ?? null
}
