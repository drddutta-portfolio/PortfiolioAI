import type { ScoringMethodologyState, ScoringProfileSource } from "./scoringTypes"
import { routeResearchProfileV1 } from "./researchProfileRouting"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"

export interface ScoringProfileResolution {
  readonly profileCode: string | null
  readonly ruleProfile: string | null
  readonly profileSource: ScoringProfileSource
  readonly methodologyState: ScoringMethodologyState
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
      reasonCode: "REGISTERED_PROFILE_METHODOLOGY_PENDING",
    }
  }

  return {
    profileCode: engine.engineCode,
    ruleProfile: engine.engineCode === "BANK_NBFC" || engine.engineCode === "PHARMA_V1" ? engine.engineCode : "GENERAL",
    profileSource: "SECTOR_RULE",
    methodologyState: "AVAILABLE",
    reasonCode: "SUPPORTED_ENGINE_ROUTED",
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
 * engine in SECTOR_ENGINE_REGISTRY may do so. K4 placeholders deliberately
 * remain GENERAL/fail-closed until their methodology package is approved.
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
      reasonCode: "REVIEWED_PHARMA_ASSIGNMENT",
      legacyAssignmentCode: reviewedAssignmentCode,
    }
  }

  if (reviewedAssignmentCode) {
    return {
      profileCode: reviewedAssignmentCode,
      ruleProfile: reviewedAssignmentCode === "BANK_NBFC" ? "BANK_NBFC" : "GENERAL",
      profileSource: "REVIEWED_ASSIGNMENT",
      methodologyState: "AVAILABLE",
      reasonCode: "REVIEWED_SCORING_PROFILE_ASSIGNMENT",
      legacyAssignmentCode: reviewedAssignmentCode,
    }
  }

  const inferred = routedEngineProfile(sector, industry)
  return {
    ...inferred,
    legacyAssignmentCode: null,
  }
}
