import type { ScoringProfileSource } from "./scoringTypes"

export interface ScoringProfileResolution {
  readonly profileCode: string
  readonly ruleProfile: string
  readonly profileSource: ScoringProfileSource
  readonly legacyAssignmentCode: string | null
}

function normalized(value: string | null) {
  return value?.trim().toUpperCase() ?? ""
}

export function isPharmaScoringContext(sector: string | null, industry: string | null) {
  const sectorKey = normalized(sector)
  const industryKey = normalized(industry)
  return sectorKey === "PHARMA" || industryKey === "PHARMACEUTICALS"
}

function inferredProfile(sector: string | null, industry: string | null): { readonly code: string; readonly source: ScoringProfileSource } {
  const haystack = `${sector ?? ""} ${industry ?? ""}`.trim().toUpperCase()
  if (!haystack) return { code: "GENERAL", source: "GENERAL_FALLBACK" }
  if (isPharmaScoringContext(sector, industry)) return { code: "PHARMA_V1", source: "SECTOR_RULE" }
  if (/\bBANK\b|NBFC|LENDING/.test(haystack)) return { code: "BANK_NBFC", source: "SECTOR_RULE" }
  if (/\bIT\b|TECHNOLOGY|SOFTWARE/.test(haystack)) return { code: "IT_TECH", source: "SECTOR_RULE" }
  if (/INDUSTRIAL|CAPITAL GOODS|ENGINEERING/.test(haystack)) return { code: "INDUSTRIALS_CAPITAL_GOODS", source: "SECTOR_RULE" }
  if (/FMCG|CONSUMER/.test(haystack)) return { code: "CONSUMER_FMCG", source: "SECTOR_RULE" }
  if (/AUTO|AUTOMOBILE/.test(haystack)) return { code: "AUTO_COMPONENTS", source: "SECTOR_RULE" }
  if (/POWER|ENERGY|UTILIT|OIL|GAS/.test(haystack)) return { code: "ENERGY_UTILITIES", source: "SECTOR_RULE" }
  if (/METAL|MINING|COMMODIT/.test(haystack)) return { code: "METALS_COMMODITIES", source: "SECTOR_RULE" }
  if (/INFRA|CONSTRUCTION|EPC/.test(haystack)) return { code: "INFRA_CONSTRUCTION", source: "SECTOR_RULE" }
  if (/REAL ESTATE|REALTY/.test(haystack)) return { code: "REAL_ESTATE", source: "SECTOR_RULE" }
  if (/FINANCIAL SERVICES|INSURANCE|ASSET MANAGEMENT/.test(haystack)) return { code: "FIN_SERVICES_NON_LENDER", source: "SECTOR_RULE" }
  return { code: "GENERAL", source: "GENERAL_FALLBACK" }
}

/**
 * Resolves the scoring methodology independently from the user-facing application
 * classification. PHARMA_HEALTHCARE is a legacy Stage 8 profile assignment; for
 * canonically classified pharmaceutical companies it aliases to PHARMA_V1 so the
 * Research page cannot silently fall back to GENERAL rules.
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

  const inferred = inferredProfile(sector, industry)
  return {
    profileCode: inferred.code,
    ruleProfile: inferred.code === "BANK_NBFC" || inferred.code === "PHARMA_V1" ? inferred.code : "GENERAL",
    profileSource: inferred.source,
    legacyAssignmentCode: null,
  }
}
