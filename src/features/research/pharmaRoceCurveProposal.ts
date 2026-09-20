import { PHARMA_RESEARCH_PROFILE_GATE_G } from "./pharmaResearchProfileGateG"
import { PHARMA_SUBPROFILE_CODES, type PharmaSubprofileCode } from "./pharmaSubprofileAssignment"

export const PHARMA_ROCE_CURVE_PROPOSAL_VERSION =
  "PHARMA_ROCE_CAPITAL_EFFICIENCY_CURVE_V1_PROPOSAL" as const

const ROCE_METRIC_CODE = "PHARMA_ROCE_HISTORY" as const
const roceMetric = PHARMA_RESEARCH_PROFILE_GATE_G.metrics.find((metric) => metric.metricCode === ROCE_METRIC_CODE)

if (!roceMetric) {
  throw new Error("PHARMA_ROCE_HISTORY is missing from PHARMA_V1 parent contract")
}

export interface PharmaRoceCurveProposal {
  readonly proposalVersion: typeof PHARMA_ROCE_CURVE_PROPOSAL_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: typeof ROCE_METRIC_CODE
  readonly canonicalDimension: "CAPITAL_EFFICIENCY"
  readonly currentParentContractDimension: typeof roceMetric.dimension
  readonly dimensionAlignmentState: "ALIGNED_VERSIONED_PARENT"
  readonly history: {
    readonly minimumComparableAnnualPeriods: 3
    readonly preferredComparableAnnualPeriods: 5
    readonly latestPeriodRequired: true
    readonly consistentCalculationSemanticsRequired: true
    readonly singleSnapshotSufficient: false
  }
  readonly methodologyShape: {
    readonly components: readonly ["LEVEL", "STABILITY", "TREND"]
    readonly componentWeightsState: "UNAPPROVED"
    readonly levelBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED"
    readonly stabilityBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED"
    readonly trendBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED"
  }
  readonly subprofileThresholds: Readonly<Record<PharmaSubprofileCode, null>>
  readonly universalNumericBandsAllowed: false
  readonly numericCurveReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

const subprofileThresholds = Object.fromEntries(
  PHARMA_SUBPROFILE_CODES.map((code) => [code, null]),
) as Readonly<Record<PharmaSubprofileCode, null>>

export const PHARMA_ROCE_CURVE_PROPOSAL: PharmaRoceCurveProposal = {
  proposalVersion: PHARMA_ROCE_CURVE_PROPOSAL_VERSION,
  state: "PROPOSAL_ONLY",
  metricCode: ROCE_METRIC_CODE,
  canonicalDimension: "CAPITAL_EFFICIENCY",
  currentParentContractDimension: roceMetric.dimension,
  dimensionAlignmentState: "ALIGNED_VERSIONED_PARENT",
  history: {
    minimumComparableAnnualPeriods: 3,
    preferredComparableAnnualPeriods: 5,
    latestPeriodRequired: true,
    consistentCalculationSemanticsRequired: true,
    singleSnapshotSufficient: false,
  },
  methodologyShape: {
    components: ["LEVEL", "STABILITY", "TREND"],
    componentWeightsState: "UNAPPROVED",
    levelBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED",
    stabilityBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED",
    trendBandsState: "SUBPROFILE_SPECIFIC_UNAPPROVED",
  },
  subprofileThresholds,
  universalNumericBandsAllowed: false,
  numericCurveReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
