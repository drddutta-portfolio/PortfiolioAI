export const PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY_VERSION =
  "PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY_V1_PROPOSAL" as const

export interface PharmaG6DomesticValuationFcfIdentityContract {
  readonly proposalVersion: typeof PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly component: "CASH_FLOW_CORROBORATION"
  readonly currentMetricIdentityState: "AMBIGUOUS"
  readonly observedIdentifiers: readonly ["FCF_YIELD", "FCF_YIELD_PERCENT"]
  readonly parentContractNamesFcfYieldSemantically: true
  readonly canonicalMetricDefinitionPresent: false
  readonly canonicalFormulaApproved: false
  readonly canonicalUnitApproved: false
  readonly aliasReconciliationApproved: false
  readonly numericThresholdsAllowed: false
  readonly wholeValuationDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY: PharmaG6DomesticValuationFcfIdentityContract = {
  proposalVersion: PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  component: "CASH_FLOW_CORROBORATION",
  currentMetricIdentityState: "AMBIGUOUS",
  observedIdentifiers: ["FCF_YIELD", "FCF_YIELD_PERCENT"],
  parentContractNamesFcfYieldSemantically: true,
  canonicalMetricDefinitionPresent: false,
  canonicalFormulaApproved: false,
  canonicalUnitApproved: false,
  aliasReconciliationApproved: false,
  numericThresholdsAllowed: false,
  wholeValuationDimensionReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
