import { PHARMA_RESEARCH_PROFILE_GATE_G } from "./pharmaResearchProfileGateG"
import { PHARMA_SUBPROFILE_CODES, type PharmaSubprofileCode } from "./pharmaSubprofileAssignment"

export const PHARMA_CASH_CONVERSION_CURVE_PROPOSAL_VERSION =
  "PHARMA_CASH_CONVERSION_CURVE_V1_PROPOSAL" as const

const CASH_CONVERSION_METRIC_CODE = "PHARMA_CASH_CONVERSION_HISTORY" as const
const cashMetric = PHARMA_RESEARCH_PROFILE_GATE_G.metrics.find(
  (metric) => metric.metricCode === CASH_CONVERSION_METRIC_CODE,
)

if (!cashMetric) {
  throw new Error("PHARMA_CASH_CONVERSION_HISTORY is missing from PHARMA_V1 parent contract")
}

export interface PharmaCashConversionCurveProposal {
  readonly proposalVersion: typeof PHARMA_CASH_CONVERSION_CURVE_PROPOSAL_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: typeof CASH_CONVERSION_METRIC_CODE
  readonly canonicalDimension: "CASH_FLOW"
  readonly currentParentContractDimension: typeof cashMetric.dimension
  readonly dimensionAlignmentState: "ALIGNED_VERSIONED_PARENT"
  readonly history: {
    readonly minimumComparableAnnualPeriods: 3
    readonly preferredComparableAnnualPeriods: 5
    readonly latestPeriodRequired: true
    readonly matchedCfoPatAndCapexFcfPeriodsRequired: true
    readonly cfoAloneSufficient: false
    readonly singleSnapshotSufficient: false
  }
  readonly methodologyShape: {
    readonly components: readonly [
      "CFO_TO_PAT_CONVERSION",
      "FCF_CONVERSION",
      "CONSISTENCY_AND_TREND",
    ]
    readonly componentWeightsState: "UNAPPROVED"
    readonly cfoToPatBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED"
    readonly fcfConversionBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED"
    readonly consistencyTrendBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED"
  }
  readonly subprofileThresholds: Readonly<Record<PharmaSubprofileCode, null>>
  readonly universalNumericBandsAllowed: false
  readonly capexIntensityContextRequired: true
  readonly numericCurveReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

const subprofileThresholds = Object.fromEntries(
  PHARMA_SUBPROFILE_CODES.map((code) => [code, null]),
) as Readonly<Record<PharmaSubprofileCode, null>>

export const PHARMA_CASH_CONVERSION_CURVE_PROPOSAL: PharmaCashConversionCurveProposal = {
  proposalVersion: PHARMA_CASH_CONVERSION_CURVE_PROPOSAL_VERSION,
  state: "PROPOSAL_ONLY",
  metricCode: CASH_CONVERSION_METRIC_CODE,
  canonicalDimension: "CASH_FLOW",
  currentParentContractDimension: cashMetric.dimension,
  dimensionAlignmentState: "ALIGNED_VERSIONED_PARENT",
  history: {
    minimumComparableAnnualPeriods: 3,
    preferredComparableAnnualPeriods: 5,
    latestPeriodRequired: true,
    matchedCfoPatAndCapexFcfPeriodsRequired: true,
    cfoAloneSufficient: false,
    singleSnapshotSufficient: false,
  },
  methodologyShape: {
    components: [
      "CFO_TO_PAT_CONVERSION",
      "FCF_CONVERSION",
      "CONSISTENCY_AND_TREND",
    ],
    componentWeightsState: "UNAPPROVED",
    cfoToPatBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED",
    fcfConversionBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED",
    consistencyTrendBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED",
  },
  subprofileThresholds,
  universalNumericBandsAllowed: false,
  capexIntensityContextRequired: true,
  numericCurveReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
