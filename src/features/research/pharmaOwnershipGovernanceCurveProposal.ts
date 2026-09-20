import { PHARMA_RESEARCH_PROFILE_GATE_G } from "./pharmaResearchProfileGateG"

export const PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL_VERSION =
  "PHARMA_OWNERSHIP_GOVERNANCE_CURVE_V1_PROPOSAL" as const

const OWNERSHIP_GOVERNANCE_METRIC_CODE = "PHARMA_OWNERSHIP_GOVERNANCE" as const
const ownershipMetric = PHARMA_RESEARCH_PROFILE_GATE_G.metrics.find(
  (metric) => metric.metricCode === OWNERSHIP_GOVERNANCE_METRIC_CODE,
)

if (!ownershipMetric) {
  throw new Error("PHARMA_OWNERSHIP_GOVERNANCE is missing from PHARMA_V1 parent contract")
}

export interface PharmaOwnershipGovernanceCurveProposal {
  readonly proposalVersion: typeof PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: typeof OWNERSHIP_GOVERNANCE_METRIC_CODE
  readonly canonicalDimension: "OWNERSHIP_GOVERNANCE"
  readonly currentParentContractDimension: typeof ownershipMetric.dimension
  readonly dimensionAlignmentState: "ALIGNED_VERSIONED_PARENT"
  readonly history: {
    readonly minimumComparableShareholdingQuarters: 4
    readonly preferredComparableShareholdingQuarters: 8
    readonly latestShareholdingQuarterRequired: true
    readonly currentMaterialGovernanceEventsRequired: true
    readonly promoterAbsenceAutomaticallyNegative: false
  }
  readonly methodologyShape: {
    readonly components: readonly [
      "OWNERSHIP_STRUCTURE_AND_STABILITY",
      "PLEDGE_AND_CONTROL_RISK",
      "GOVERNANCE_EVENT_CONTEXT",
    ]
    readonly componentWeightsState: "UNAPPROVED"
    readonly ownershipBandsState: "UNAPPROVED"
    readonly pledgeBandsState: "UNAPPROVED"
    readonly eventContextBandsState: "UNAPPROVED"
  }
  readonly governanceGateSeparation: {
    readonly g4CriticalOrBlockedEventMayReceiveSecondHiddenPenalty: false
    readonly g4HighRiskMayReceiveSecondHiddenPenalty: false
    readonly governanceEventContextMayRemainVisible: true
    readonly additionalGateCapInsideDimensionAllowed: false
  }
  readonly promoterPercentageAbsoluteLevelAloneSufficient: false
  readonly pledgeZeroAutomaticallyBestScore: false
  readonly institutionalOwnershipAutomaticallyPositive: false
  readonly numericCurveReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL: PharmaOwnershipGovernanceCurveProposal = {
  proposalVersion: PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL_VERSION,
  state: "PROPOSAL_ONLY",
  metricCode: OWNERSHIP_GOVERNANCE_METRIC_CODE,
  canonicalDimension: "OWNERSHIP_GOVERNANCE",
  currentParentContractDimension: ownershipMetric.dimension,
  dimensionAlignmentState: "ALIGNED_VERSIONED_PARENT",
  history: {
    minimumComparableShareholdingQuarters: 4,
    preferredComparableShareholdingQuarters: 8,
    latestShareholdingQuarterRequired: true,
    currentMaterialGovernanceEventsRequired: true,
    promoterAbsenceAutomaticallyNegative: false,
  },
  methodologyShape: {
    components: [
      "OWNERSHIP_STRUCTURE_AND_STABILITY",
      "PLEDGE_AND_CONTROL_RISK",
      "GOVERNANCE_EVENT_CONTEXT",
    ],
    componentWeightsState: "UNAPPROVED",
    ownershipBandsState: "UNAPPROVED",
    pledgeBandsState: "UNAPPROVED",
    eventContextBandsState: "UNAPPROVED",
  },
  governanceGateSeparation: {
    g4CriticalOrBlockedEventMayReceiveSecondHiddenPenalty: false,
    g4HighRiskMayReceiveSecondHiddenPenalty: false,
    governanceEventContextMayRemainVisible: true,
    additionalGateCapInsideDimensionAllowed: false,
  },
  promoterPercentageAbsoluteLevelAloneSufficient: false,
  pledgeZeroAutomaticallyBestScore: false,
  institutionalOwnershipAutomaticallyPositive: false,
  numericCurveReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
