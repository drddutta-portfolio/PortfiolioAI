import type { PharmaGovernanceRegulatoryGateResult } from "./pharmaGovernanceRegulatoryGateContract"

export const PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT_VERSION =
  "PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT_V1_PROPOSAL" as const

export type PharmaGlobalGenericsRegulatoryContextState =
  | "BLOCKED_REVIEW"
  | "REVIEW_REQUIRED"
  | "HIGH_RISK_CONTEXT"
  | "CLEAR_CONTEXT"

export interface PharmaGlobalGenericsRegulatorySiteTreatmentContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: "PHARMA_REGULATORY_SITE_STATUS"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "RISK"
  readonly requirementLevel: "MANDATORY_WHEN_REGULATED_EXPORT_EXPOSURE_EXISTS"
  readonly evidenceRequirements: {
    readonly officialEvidenceRequired: true
    readonly affectedFacilityProductGeographyRequired: true
    readonly materialityRequired: true
    readonly currentUnresolvedActionsRequired: true
    readonly latestMaterialInspectionOrRemediationStateRequired: true
    readonly singleSiteCloseoutMayImplyCompanyWideClearance: false
  }
  readonly g4Separation: {
    readonly g4IsAuthoritativeForBlockReviewAndHighRiskState: true
    readonly g4BlockedReviewMayReceiveSecondNumericPenalty: false
    readonly g4HighRiskMayReceiveSecondNumericPenalty: false
    readonly remediationErasesHistoricalEvent: false
    readonly regulatoryContextMayRemainVisibleInsideRiskDimension: true
  }
  readonly riskDimensionBoundary: {
    readonly regulatoryNumericScoreApproved: false
    readonly regulatoryNumericCapApproved: false
    readonly missingRegulatoryEvidenceMayBecomeNeutral: false
    readonly marketDrawdownRemainsSeparateComponent: true
    readonly marketVolatilityRemainsSeparateComponent: true
    readonly wholeRiskDimensionReady: false
  }
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT:
  PharmaGlobalGenericsRegulatorySiteTreatmentContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT_VERSION,
    state: "PROPOSAL_ONLY",
    metricCode: "PHARMA_REGULATORY_SITE_STATUS",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "RISK",
    requirementLevel: "MANDATORY_WHEN_REGULATED_EXPORT_EXPOSURE_EXISTS",
    evidenceRequirements: {
      officialEvidenceRequired: true,
      affectedFacilityProductGeographyRequired: true,
      materialityRequired: true,
      currentUnresolvedActionsRequired: true,
      latestMaterialInspectionOrRemediationStateRequired: true,
      singleSiteCloseoutMayImplyCompanyWideClearance: false,
    },
    g4Separation: {
      g4IsAuthoritativeForBlockReviewAndHighRiskState: true,
      g4BlockedReviewMayReceiveSecondNumericPenalty: false,
      g4HighRiskMayReceiveSecondNumericPenalty: false,
      remediationErasesHistoricalEvent: false,
      regulatoryContextMayRemainVisibleInsideRiskDimension: true,
    },
    riskDimensionBoundary: {
      regulatoryNumericScoreApproved: false,
      regulatoryNumericCapApproved: false,
      missingRegulatoryEvidenceMayBecomeNeutral: false,
      marketDrawdownRemainsSeparateComponent: true,
      marketVolatilityRemainsSeparateComponent: true,
      wholeRiskDimensionReady: false,
    },
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export interface PharmaGlobalGenericsRegulatorySiteTreatmentResult {
  readonly contextState: PharmaGlobalGenericsRegulatoryContextState
  readonly blocksPreview: boolean
  readonly interpretationProminenceRequired: boolean
  readonly regulatoryNumericScore: null
  readonly additionalNumericPenalty: null
  readonly historicalEventRetained: boolean
  readonly reasonCodes: readonly string[]
  readonly wholeRiskDimensionReady: false
}

export function projectGlobalGenericsRegulatorySiteTreatment(
  gateResult: PharmaGovernanceRegulatoryGateResult,
): PharmaGlobalGenericsRegulatorySiteTreatmentResult {
  const contextState: PharmaGlobalGenericsRegulatoryContextState =
    gateResult.gateState === "BLOCKED_REVIEW"
      ? "BLOCKED_REVIEW"
      : gateResult.gateState === "REVIEW_REQUIRED"
        ? "REVIEW_REQUIRED"
        : gateResult.gateState === "HIGH_RISK"
          ? "HIGH_RISK_CONTEXT"
          : "CLEAR_CONTEXT"

  return {
    contextState,
    blocksPreview: gateResult.blocksPreview,
    interpretationProminenceRequired: gateResult.interpretationProminenceRequired,
    regulatoryNumericScore: null,
    additionalNumericPenalty: null,
    historicalEventRetained: gateResult.historicalEventRetained,
    reasonCodes: gateResult.reasonCodes,
    wholeRiskDimensionReady: false,
  }
}
