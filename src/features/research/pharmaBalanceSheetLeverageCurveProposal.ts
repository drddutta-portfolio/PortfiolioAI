import { PHARMA_RESEARCH_PROFILE_GATE_G } from "./pharmaResearchProfileGateG"
import { PHARMA_SUBPROFILE_CODES, type PharmaSubprofileCode } from "./pharmaSubprofileAssignment"

export const PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL_VERSION =
  "PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_V1_PROPOSAL" as const

const BALANCE_SHEET_METRIC_CODE = "PHARMA_BALANCE_SHEET_LEVERAGE" as const
const balanceSheetMetric = PHARMA_RESEARCH_PROFILE_GATE_G.metrics.find(
  (metric) => metric.metricCode === BALANCE_SHEET_METRIC_CODE,
)

if (!balanceSheetMetric) {
  throw new Error("PHARMA_BALANCE_SHEET_LEVERAGE is missing from PHARMA_V1 parent contract")
}

export interface PharmaBalanceSheetLeverageCurveProposal {
  readonly proposalVersion: typeof PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: typeof BALANCE_SHEET_METRIC_CODE
  readonly canonicalDimension: "BALANCE_SHEET_CREDIT"
  readonly currentParentContractDimension: typeof balanceSheetMetric.dimension
  readonly dimensionAlignmentState: "ALIGNED_VERSIONED_PARENT"
  readonly history: {
    readonly minimumComparableAnnualPeriods: 3
    readonly preferredComparableAnnualPeriods: 5
    readonly latestBalanceSheetPeriodRequired: true
    readonly matchedDebtCashAndOperatingEarningsRequired: true
    readonly pointInTimeOnlySufficient: false
    readonly singleSnapshotSufficient: false
  }
  readonly methodologyShape: {
    readonly components: readonly [
      "NET_DEBT_LEVERAGE",
      "INTEREST_COVERAGE",
      "BALANCE_SHEET_TREND_AND_RESILIENCE",
    ]
    readonly componentWeightsState: "UNAPPROVED"
    readonly leverageBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED"
    readonly interestCoverageBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED"
    readonly trendResilienceBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED"
  }
  readonly subprofileThresholds: Readonly<Record<PharmaSubprofileCode, null>>
  readonly universalNumericBandsAllowed: false
  readonly cashOffsetRequiresReviewedCashDefinition: true
  readonly netCashRequiresExplicitTreatment: true
  readonly acquisitionAndExpansionContextRequired: true
  readonly numericCurveReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

const subprofileThresholds = Object.fromEntries(
  PHARMA_SUBPROFILE_CODES.map((code) => [code, null]),
) as Readonly<Record<PharmaSubprofileCode, null>>

export const PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL: PharmaBalanceSheetLeverageCurveProposal = {
  proposalVersion: PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL_VERSION,
  state: "PROPOSAL_ONLY",
  metricCode: BALANCE_SHEET_METRIC_CODE,
  canonicalDimension: "BALANCE_SHEET_CREDIT",
  currentParentContractDimension: balanceSheetMetric.dimension,
  dimensionAlignmentState: "ALIGNED_VERSIONED_PARENT",
  history: {
    minimumComparableAnnualPeriods: 3,
    preferredComparableAnnualPeriods: 5,
    latestBalanceSheetPeriodRequired: true,
    matchedDebtCashAndOperatingEarningsRequired: true,
    pointInTimeOnlySufficient: false,
    singleSnapshotSufficient: false,
  },
  methodologyShape: {
    components: [
      "NET_DEBT_LEVERAGE",
      "INTEREST_COVERAGE",
      "BALANCE_SHEET_TREND_AND_RESILIENCE",
    ],
    componentWeightsState: "UNAPPROVED",
    leverageBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED",
    interestCoverageBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED",
    trendResilienceBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED",
  },
  subprofileThresholds,
  universalNumericBandsAllowed: false,
  cashOffsetRequiresReviewedCashDefinition: true,
  netCashRequiresExplicitTreatment: true,
  acquisitionAndExpansionContextRequired: true,
  numericCurveReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
