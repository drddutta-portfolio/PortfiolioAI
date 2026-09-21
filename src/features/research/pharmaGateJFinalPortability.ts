import { PHARMA_API_G10_1_NUMERIC_METHODOLOGY_VERSION } from "./pharmaApiG101NumericMethodology"
import { PHARMA_BIOSIMILARS_G10_3_METHODOLOGY_VERSION } from "./pharmaBiosimilarsG103Methodology"
import { PHARMA_CDMO_G10_4_METHODOLOGY_VERSION } from "./pharmaCdmoG104Methodology"
import { PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION } from "./pharmaDomesticGateGFinal2NumericMethodology"
import { PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY_VERSION } from "./pharmaGlobalGenericsG102NumericMethodology"
import { PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION } from "./pharmaRecommendationPolicyCandidate"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type {
  PharmaSubprofileCode,
  PharmaSubprofileResolution,
  ResearchSubprofileExposure,
} from "./pharmaSubprofileAssignment"

export const PHARMA_GATE_J_FINAL_PORTABILITY_VERSION =
  "PHARMA_GATE_J_FINAL_PORTABILITY_V1" as const

export interface PharmaGateJMethodAuthority {
  readonly subprofileCode: PharmaSubprofileCode
  readonly displayName: string
  readonly methodologyVersion: string
  readonly referenceValidationSymbol: string
  readonly referenceStage: string
  readonly commonTenDimensionSpinePreserved: true
  readonly gateIRecommendationPolicyVersion: typeof PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION
  readonly symbolSpecificRuntimeRequired: false
}

export const PHARMA_GATE_J_METHOD_AUTHORITIES:
  Readonly<Record<PharmaSubprofileCode, PharmaGateJMethodAuthority>> = {
    DOMESTIC_FORMULATIONS: {
      subprofileCode: "DOMESTIC_FORMULATIONS",
      displayName: PHARMA_SUBPROFILE_CONTRACTS.DOMESTIC_FORMULATIONS.displayName,
      methodologyVersion: PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
      referenceValidationSymbol: "TORNTPHARM",
      referenceStage: "GATE_H_CONTROL",
      commonTenDimensionSpinePreserved: true,
      gateIRecommendationPolicyVersion: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION,
      symbolSpecificRuntimeRequired: false,
    },
    API_BULK_DRUGS: {
      subprofileCode: "API_BULK_DRUGS",
      displayName: PHARMA_SUBPROFILE_CONTRACTS.API_BULK_DRUGS.displayName,
      methodologyVersion: PHARMA_API_G10_1_NUMERIC_METHODOLOGY_VERSION,
      referenceValidationSymbol: "ALIVUS",
      referenceStage: "G10.1",
      commonTenDimensionSpinePreserved: true,
      gateIRecommendationPolicyVersion: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION,
      symbolSpecificRuntimeRequired: false,
    },
    GLOBAL_GENERICS: {
      subprofileCode: "GLOBAL_GENERICS",
      displayName: PHARMA_SUBPROFILE_CONTRACTS.GLOBAL_GENERICS.displayName,
      methodologyVersion: PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY_VERSION,
      referenceValidationSymbol: "AUROPHARMA",
      referenceStage: "G10.2",
      commonTenDimensionSpinePreserved: true,
      gateIRecommendationPolicyVersion: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION,
      symbolSpecificRuntimeRequired: false,
    },
    BIOPHARMA_BIOSIMILARS: {
      subprofileCode: "BIOPHARMA_BIOSIMILARS",
      displayName: PHARMA_SUBPROFILE_CONTRACTS.BIOPHARMA_BIOSIMILARS.displayName,
      methodologyVersion: PHARMA_BIOSIMILARS_G10_3_METHODOLOGY_VERSION,
      referenceValidationSymbol: "BIOCON",
      referenceStage: "G10.3",
      commonTenDimensionSpinePreserved: true,
      gateIRecommendationPolicyVersion: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION,
      symbolSpecificRuntimeRequired: false,
    },
    CDMO_CRAMS: {
      subprofileCode: "CDMO_CRAMS",
      displayName: PHARMA_SUBPROFILE_CONTRACTS.CDMO_CRAMS.displayName,
      methodologyVersion: PHARMA_CDMO_G10_4_METHODOLOGY_VERSION,
      referenceValidationSymbol: "SYNGENE",
      referenceStage: "G10.4",
      commonTenDimensionSpinePreserved: true,
      gateIRecommendationPolicyVersion: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION,
      symbolSpecificRuntimeRequired: false,
    },
  }

function activeReviewedExposure(
  exposure: ResearchSubprofileExposure,
  evaluationDate: string,
) {
  return exposure.assignmentState === "REVIEWED"
    && exposure.effectiveFrom !== null
    && exposure.effectiveFrom <= evaluationDate
    && (exposure.effectiveTo === null || evaluationDate < exposure.effectiveTo)
}

export type PharmaGateJFinalPortabilityStatus =
  | {
      readonly version: typeof PHARMA_GATE_J_FINAL_PORTABILITY_VERSION
      readonly state: "BLOCKED_SUBPROFILE_REVIEW"
      readonly profileCode: "PHARMA_V1"
      readonly primarySubprofile: null
      readonly methodologyAuthority: null
      readonly materialOverlays: readonly []
      readonly emergingWatches: readonly []
      readonly scoreExecutionAllowed: false
      readonly recommendationExecutionAllowed: false
      readonly scorePersistenceEnabled: false
      readonly recommendationPersistenceEnabled: false
      readonly secondIndependentStockScoreAllowed: false
      readonly hiddenRenormalizationAllowed: false
    }
  | {
      readonly version: typeof PHARMA_GATE_J_FINAL_PORTABILITY_VERSION
      readonly state: "PORTABLE_METHOD_AUTHORITY_RESOLVED"
      readonly profileCode: "PHARMA_V1"
      readonly primarySubprofile: PharmaSubprofileCode
      readonly methodologyAuthority: PharmaGateJMethodAuthority
      readonly materialOverlays: readonly PharmaSubprofileCode[]
      readonly emergingWatches: readonly PharmaSubprofileCode[]
      readonly scoreExecutionAllowed: false
      readonly recommendationExecutionAllowed: false
      readonly scorePersistenceEnabled: false
      readonly recommendationPersistenceEnabled: false
      readonly secondIndependentStockScoreAllowed: false
      readonly hiddenRenormalizationAllowed: false
    }

export function buildPharmaGateJFinalPortabilityStatus(
  resolution: PharmaSubprofileResolution | null,
  evaluationDate: string,
): PharmaGateJFinalPortabilityStatus {
  if (!resolution || resolution.status !== "RESOLVED") {
    return {
      version: PHARMA_GATE_J_FINAL_PORTABILITY_VERSION,
      state: "BLOCKED_SUBPROFILE_REVIEW",
      profileCode: "PHARMA_V1",
      primarySubprofile: null,
      methodologyAuthority: null,
      materialOverlays: [],
      emergingWatches: [],
      scoreExecutionAllowed: false,
      recommendationExecutionAllowed: false,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
      secondIndependentStockScoreAllowed: false,
      hiddenRenormalizationAllowed: false,
    }
  }

  const activeSecondaries = resolution.assignment.secondaryExposures.filter(
    (exposure) => activeReviewedExposure(exposure, evaluationDate),
  )

  return {
    version: PHARMA_GATE_J_FINAL_PORTABILITY_VERSION,
    state: "PORTABLE_METHOD_AUTHORITY_RESOLVED",
    profileCode: "PHARMA_V1",
    primarySubprofile: resolution.assignment.primarySubprofileCode,
    methodologyAuthority:
      PHARMA_GATE_J_METHOD_AUTHORITIES[resolution.assignment.primarySubprofileCode],
    materialOverlays: activeSecondaries
      .filter((exposure) => exposure.materiality === "MATERIAL")
      .map((exposure) => exposure.exposureCode),
    emergingWatches: activeSecondaries
      .filter((exposure) => exposure.materiality === "EMERGING")
      .map((exposure) => exposure.exposureCode),
    scoreExecutionAllowed: false,
    recommendationExecutionAllowed: false,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
    secondIndependentStockScoreAllowed: false,
    hiddenRenormalizationAllowed: false,
  }
}
