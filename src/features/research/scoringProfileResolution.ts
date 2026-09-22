import type { ScoringExecutionState, ScoringMethodologyState, ScoringProfileSource } from "./scoringTypes"
import { routeResearchProfileV1 } from "./researchProfileRouting"
import { SECTOR_ENGINE_REGISTRY, sectorEngineForProfileCode } from "./sectorEngineRegistry"

export interface ScoringProfileResolution {
  readonly profileCode: string | null
  readonly ruleProfile: string | null
  readonly profileSource: ScoringProfileSource
  readonly methodologyState: ScoringMethodologyState
  readonly scoringExecutionState: ScoringExecutionState
  readonly reasonCode: string
  readonly legacyAssignmentCode: string | null
}

function routedEngineProfile(
  sector: string | null,
  industry: string | null,
): Omit<ScoringProfileResolution, "legacyAssignmentCode"> {
  const routed = routeResearchProfileV1({
    assetClass: "EQUITY",
    applicationSector: sector,
    applicationIndustry: industry,
  })

  if (routed.state !== "ROUTED" || routed.profileCode === null) {
    return {
      profileCode: null,
      ruleProfile: null,
      profileSource: "METHODOLOGY_UNAVAILABLE",
      methodologyState: routed.state === "REVIEW_REQUIRED" || routed.basis === "CLASSIFICATION_MISSING"
        ? "REVIEW_REQUIRED"
        : "METHODOLOGY_NOT_AVAILABLE",
      scoringExecutionState: "BLOCKED",
      reasonCode: routed.reasonCode,
    }
  }

  const engine = sectorEngineForProfileCode(routed.profileCode)
  if (!engine || engine.lifecycle === "K4_FROZEN_PENDING") {
    return {
      profileCode: null,
      ruleProfile: null,
      profileSource: "METHODOLOGY_UNAVAILABLE",
      methodologyState: "METHODOLOGY_NOT_AVAILABLE",
      scoringExecutionState: "BLOCKED",
      reasonCode: engine ? "ENGINE_NOT_IMPLEMENTED" : "ROUTED_PROFILE_HAS_NO_REGISTERED_ENGINE",
    }
  }

  const profileAuthority = engine.profileAuthorities?.[routed.profileCode]
  if (profileAuthority?.state === "PENDING_METHODOLOGY") {
    return {
      profileCode: null,
      ruleProfile: null,
      profileSource: "METHODOLOGY_UNAVAILABLE",
      methodologyState: "METHODOLOGY_NOT_AVAILABLE",
      scoringExecutionState: "BLOCKED",
      reasonCode: "REGISTERED_PROFILE_METHODOLOGY_PENDING",
    }
  }

  return {
    profileCode: engine.engineCode,
    ruleProfile: engine.engineCode === "BANK_NBFC" || engine.engineCode === "PHARMA_V1" ? engine.engineCode : null,
    profileSource: "SECTOR_RULE",
    methodologyState: "AVAILABLE",
    scoringExecutionState: engine.engineCode === "BANK_NBFC" || engine.engineCode === "PHARMA_V1" ? "AVAILABLE" : "PENDING_ADAPTER",
    reasonCode: engine.engineCode === "BANK_NBFC" || engine.engineCode === "PHARMA_V1" ? "SUPPORTED_ENGINE_ROUTED" : "SECTOR_SCORING_ADAPTER_PENDING",
  }
}

export function isPharmaScoringContext(sector: string | null, industry: string | null) {
  return routedEngineProfile(sector, industry).profileCode === "PHARMA_V1"
}

/**
 * Resolves scoring methodology downstream of the K1 industry-first router.
 *
 * A sector label alone cannot activate a specialised scoring engine. Only a
 * reviewed assignment or a ROUTED profile that maps to an implemented/inherited
 * engine in SECTOR_ENGINE_REGISTRY may do so. Completed K4 methodologies stay
 * recognised but fail closed until their live score-execution adapter is active.
 */
export function resolveScoringProfile(
  sector: string | null,
  industry: string | null,
  reviewedAssignmentCode: string | null,
): ScoringProfileResolution {
  if (reviewedAssignmentCode === "PHARMA_HEALTHCARE" && isPharmaScoringContext(sector, industry)) {
    return {
      profileCode: "PHARMA_V1",
      ruleProfile: "PHARMA_V1",
      profileSource: "REVIEWED_ASSIGNMENT",
      methodologyState: "AVAILABLE",
      scoringExecutionState: "AVAILABLE",
      reasonCode: "REVIEWED_PHARMA_ASSIGNMENT",
      legacyAssignmentCode: reviewedAssignmentCode,
    }
  }

  if (reviewedAssignmentCode) {
    const reviewedEngine = SECTOR_ENGINE_REGISTRY.find((entry) => entry.engineCode === reviewedAssignmentCode)
    const activeRuleProfile = reviewedAssignmentCode === "GENERAL" || reviewedAssignmentCode === "BANK_NBFC" || reviewedAssignmentCode === "PHARMA_V1"
      ? reviewedAssignmentCode
      : null
    return {
      profileCode: reviewedAssignmentCode,
      ruleProfile: activeRuleProfile,
      profileSource: "REVIEWED_ASSIGNMENT",
      methodologyState: reviewedEngine || activeRuleProfile ? "AVAILABLE" : "METHODOLOGY_NOT_AVAILABLE",
      scoringExecutionState: activeRuleProfile ? "AVAILABLE" : reviewedEngine ? "PENDING_ADAPTER" : "BLOCKED",
      reasonCode: activeRuleProfile ? "REVIEWED_SCORING_PROFILE_ASSIGNMENT" : reviewedEngine ? "SECTOR_SCORING_ADAPTER_PENDING" : "REVIEWED_PROFILE_HAS_NO_SCORING_AUTHORITY",
      legacyAssignmentCode: reviewedAssignmentCode,
    }
  }

  const inferred = routedEngineProfile(sector, industry)
  return {
    ...inferred,
    legacyAssignmentCode: null,
  }
}
