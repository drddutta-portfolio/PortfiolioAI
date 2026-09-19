import {
  PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE,
  type PharmaGlobalGenericsVolatilityContextMethod,
} from "./pharmaGlobalGenericsVolatilityContextMethodGate"

export const PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY_VERSION =
  "PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY_V1_PROPOSAL" as const

export type PharmaGlobalGenericsVolatilityContextBlocker =
  | "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED"
  | "APPROVED_PHARMA_BENCHMARK_NOT_ESTABLISHED"
  | "SELF_HISTORY_WITH_EXTERNAL_CONTEXT_NOT_ESTABLISHED"
  | "HYBRID_REQUIRES_TWO_ELIGIBLE_CONTEXT_METHODS"

export interface PharmaGlobalGenericsVolatilityContextEvidenceSufficiencyContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "RISK"
  readonly metricCode: "VOLATILITY_1Y"
  readonly upstreamMethodGateVersion: typeof PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE.contractVersion
  readonly methodStatus: Readonly<Record<PharmaGlobalGenericsVolatilityContextMethod, {
    readonly eligibleNow: false
    readonly blocker: PharmaGlobalGenericsVolatilityContextBlocker
  }>>
  readonly approvedMethod: null
  readonly deferralRequired: true
  readonly numericVolatilityCurveReady: false
  readonly wholeRiskDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY:
  PharmaGlobalGenericsVolatilityContextEvidenceSufficiencyContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "RISK",
    metricCode: "VOLATILITY_1Y",
    upstreamMethodGateVersion: PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE.contractVersion,
    methodStatus: {
      SAME_SUBPROFILE_PEER_RELATIVE: {
        eligibleNow: false,
        blocker: "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      },
      BENCHMARK_RELATIVE: {
        eligibleNow: false,
        blocker: "APPROVED_PHARMA_BENCHMARK_NOT_ESTABLISHED",
      },
      SELF_HISTORY_WITH_EXTERNAL_CONTEXT: {
        eligibleNow: false,
        blocker: "SELF_HISTORY_WITH_EXTERNAL_CONTEXT_NOT_ESTABLISHED",
      },
      HYBRID_EXPLICITLY_VERSIONED: {
        eligibleNow: false,
        blocker: "HYBRID_REQUIRES_TWO_ELIGIBLE_CONTEXT_METHODS",
      },
    },
    approvedMethod: null,
    deferralRequired: true,
    numericVolatilityCurveReady: false,
    wholeRiskDimensionReady: false,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function listGlobalGenericsVolatilityContextBlockers() {
  return Object.entries(PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY.methodStatus)
    .map(([method, status]) => ({
      method: method as PharmaGlobalGenericsVolatilityContextMethod,
      blocker: status.blocker,
    }))
}
