import {
  PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE,
  type PharmaGlobalGenericsDrawdownCandidateMethod,
} from "./pharmaGlobalGenericsDrawdownMethodGate"

export const PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY_VERSION =
  "PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY_V1_PROPOSAL" as const

export type PharmaGlobalGenericsDrawdownMethodBlocker =
  | "EMPIRICAL_PHARMA_BANDS_NOT_ESTABLISHED"
  | "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED"
  | "APPROVED_PHARMA_BENCHMARK_NOT_ESTABLISHED"
  | "SUFFICIENT_COMPARABLE_SELF_HISTORY_NOT_ESTABLISHED"
  | "HYBRID_REQUIRES_TWO_ELIGIBLE_METHODS"

export interface PharmaGlobalGenericsDrawdownEvidenceSufficiencyContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "RISK"
  readonly metricCode: "MAX_DRAWDOWN_1Y"
  readonly upstreamMethodGateVersion: typeof PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE.contractVersion
  readonly methodStatus: Readonly<Record<PharmaGlobalGenericsDrawdownCandidateMethod, {
    readonly eligibleNow: false
    readonly blocker: PharmaGlobalGenericsDrawdownMethodBlocker
  }>>
  readonly approvedMethod: null
  readonly deferralRequired: true
  readonly numericDrawdownCurveReady: false
  readonly wholeRiskDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY:
  PharmaGlobalGenericsDrawdownEvidenceSufficiencyContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "RISK",
    metricCode: "MAX_DRAWDOWN_1Y",
    upstreamMethodGateVersion: PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE.contractVersion,
    methodStatus: {
      ABSOLUTE_BANDS: {
        eligibleNow: false,
        blocker: "EMPIRICAL_PHARMA_BANDS_NOT_ESTABLISHED",
      },
      SAME_SUBPROFILE_PEER_RELATIVE: {
        eligibleNow: false,
        blocker: "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      },
      BENCHMARK_RELATIVE: {
        eligibleNow: false,
        blocker: "APPROVED_PHARMA_BENCHMARK_NOT_ESTABLISHED",
      },
      SELF_HISTORY_RELATIVE: {
        eligibleNow: false,
        blocker: "SUFFICIENT_COMPARABLE_SELF_HISTORY_NOT_ESTABLISHED",
      },
      HYBRID_EXPLICITLY_VERSIONED: {
        eligibleNow: false,
        blocker: "HYBRID_REQUIRES_TWO_ELIGIBLE_METHODS",
      },
    },
    approvedMethod: null,
    deferralRequired: true,
    numericDrawdownCurveReady: false,
    wholeRiskDimensionReady: false,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function listGlobalGenericsDrawdownMethodBlockers() {
  return Object.entries(PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY.methodStatus)
    .map(([method, status]) => ({
      method: method as PharmaGlobalGenericsDrawdownCandidateMethod,
      blocker: status.blocker,
    }))
}
