import type { ScoringProfileSource } from "./scoringTypes"
import { routeResearchProfileV1 } from "./researchProfileRouting"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"

export interface ScoringProfileResolution {
  readonly profileCode: string
  readonly ruleProfile: string
  readonly profileSource: ScoringProfileSource
  readonly legacyAssignmentCode: string | null
}

function routedEngineProfile(
  sector: string | null,
  industry: string | null,
): { readonly code: string; readonly source: ScoringProfileSource } {
  const routed = routeResearchProfileV1({
    assetClass: "EQUITY",
    applicationSector: sector,
    applicationIndustry: industry,
  })

  if (routed.state !== "ROUTED" || routed.profileCode === null) {
    return { code: "GENERAL", source: "GENERAL_FALLBACK" }
  }

  const engine = sectorEngineForProfileCode(routed.profileCode)
  if (!engine || engine.lifecycle === "K4_FROZEN_PENDING") {
    return { code: "GENERAL", source: "GENERAL_FALLBACK" }
  }

  return { code: engine.engineCode, source: "SECTOR_RULE" }
}

export function isPharmaScoringContext(sector: string | null, industry: string | null) {
  return routedEngineProfile(sector, industry).code === "PHARMA_V1"
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
      legacyAssignmentCode: reviewedAssignmentCode,
    }
  }

  if (reviewedAssignmentCode) {
    return {
      profileCode: reviewedAssignmentCode,
      ruleProfile: reviewedAssignmentCode === "BANK_NBFC" ? "BANK_NBFC" : "GENERAL",
      profileSource: "REVIEWED_ASSIGNMENT",
      legacyAssignmentCode: reviewedAssignmentCode,
    }
  }

  const inferred = routedEngineProfile(sector, industry)
  return {
    profileCode: inferred.code,
    ruleProfile: inferred.code === "BANK_NBFC" || inferred.code === "PHARMA_V1" ? inferred.code : "GENERAL",
    profileSource: inferred.source,
    legacyAssignmentCode: null,
  }
}
