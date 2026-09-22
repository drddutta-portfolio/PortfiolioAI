import type { ResearchSubprofileConfidence, ResearchSubprofileExposureMateriality } from "./pharmaSubprofileAssignment"

export type PharmaSecondaryExposureMaterialityReasonCode =
  | "INSUFFICIENT_COMPARABLE_REVENUE"
  | "INCOMPARABLE_REVENUE"
  | "QUANTITATIVE_LT_5_PERCENT"
  | "QUANTITATIVE_5_TO_LT_10_PERCENT"
  | "QUANTITATIVE_10_TO_LT_50_PERCENT"
  | "QUANTITATIVE_GTE_50_PERCENT"
  | "QUALITATIVE_OVERRIDE_EMERGING"
  | "QUALITATIVE_OVERRIDE_MATERIAL"
  | "QUALITATIVE_OVERRIDE_DOMINANT"
  | "INVALID_QUALITATIVE_OVERRIDE"

export interface PharmaSecondaryExposureQualitativeOverride {
  readonly targetMateriality: "EMERGING" | "MATERIAL" | "DOMINANT"
  readonly sourceReference: string
  readonly reasonCode: string
  readonly reviewerProvenance: string
  readonly confidence: ResearchSubprofileConfidence
  readonly effectiveFrom: string
}

export interface ResolvePharmaSecondaryExposureMaterialityInput {
  readonly exposureRevenue: number | null
  readonly comparableCompanyRevenue: number | null
  readonly qualitativeOverride?: PharmaSecondaryExposureQualitativeOverride | null
}

export interface PharmaSecondaryExposureMaterialityResolution {
  readonly materiality: ResearchSubprofileExposureMateriality
  readonly revenueShare: number | null
  readonly reasonCode: PharmaSecondaryExposureMaterialityReasonCode
  readonly requiresPrimaryReclassificationReview: boolean
  readonly qualitativeOverrideApplied: boolean
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u

const MATERIALITY_RANK: Readonly<Record<Exclude<ResearchSubprofileExposureMateriality, "UNKNOWN">, number>> = {
  IMMATERIAL: 0,
  EMERGING: 1,
  MATERIAL: 2,
  DOMINANT: 3,
}

function validRevenueInput(exposureRevenue: number | null, comparableCompanyRevenue: number | null) {
  return exposureRevenue !== null
    && comparableCompanyRevenue !== null
    && Number.isFinite(exposureRevenue)
    && Number.isFinite(comparableCompanyRevenue)
    && exposureRevenue >= 0
    && comparableCompanyRevenue > 0
}

function validOverride(override: PharmaSecondaryExposureQualitativeOverride) {
  return override.sourceReference.trim().length > 0
    && override.reasonCode.trim().length > 0
    && override.reviewerProvenance.trim().length > 0
    && (override.confidence === "MEDIUM" || override.confidence === "HIGH")
    && ISO_DATE.test(override.effectiveFrom)
}

function quantitativeMateriality(revenueShare: number): Exclude<ResearchSubprofileExposureMateriality, "UNKNOWN"> {
  if (revenueShare < 0.05) return "IMMATERIAL"
  if (revenueShare < 0.10) return "EMERGING"
  if (revenueShare < 0.50) return "MATERIAL"
  return "DOMINANT"
}

function quantitativeReason(materiality: Exclude<ResearchSubprofileExposureMateriality, "UNKNOWN">): PharmaSecondaryExposureMaterialityReasonCode {
  switch (materiality) {
    case "IMMATERIAL": return "QUANTITATIVE_LT_5_PERCENT"
    case "EMERGING": return "QUANTITATIVE_5_TO_LT_10_PERCENT"
    case "MATERIAL": return "QUANTITATIVE_10_TO_LT_50_PERCENT"
    case "DOMINANT": return "QUANTITATIVE_GTE_50_PERCENT"
  }
}

function qualitativeReason(materiality: PharmaSecondaryExposureQualitativeOverride["targetMateriality"]): PharmaSecondaryExposureMaterialityReasonCode {
  switch (materiality) {
    case "EMERGING": return "QUALITATIVE_OVERRIDE_EMERGING"
    case "MATERIAL": return "QUALITATIVE_OVERRIDE_MATERIAL"
    case "DOMINANT": return "QUALITATIVE_OVERRIDE_DOMINANT"
  }
}

/**
 * Approved Gate E V1 resolver. It is pure and fail-closed: geography, labels or
 * narrative text are never converted into a materiality state by this function.
 * The caller must provide comparable business-model-attributable revenue or an
 * explicit, provenance-complete qualitative override.
 */
export function resolvePharmaSecondaryExposureMateriality(
  input: ResolvePharmaSecondaryExposureMaterialityInput,
): PharmaSecondaryExposureMaterialityResolution {
  const override = input.qualitativeOverride ?? null

  if (override !== null && !validOverride(override)) {
    return {
      materiality: "UNKNOWN",
      revenueShare: null,
      reasonCode: "INVALID_QUALITATIVE_OVERRIDE",
      requiresPrimaryReclassificationReview: false,
      qualitativeOverrideApplied: false,
    }
  }

  if (!validRevenueInput(input.exposureRevenue, input.comparableCompanyRevenue)) {
    if (override !== null) {
      return {
        materiality: override.targetMateriality,
        revenueShare: null,
        reasonCode: qualitativeReason(override.targetMateriality),
        requiresPrimaryReclassificationReview: override.targetMateriality === "DOMINANT",
        qualitativeOverrideApplied: true,
      }
    }

    return {
      materiality: "UNKNOWN",
      revenueShare: null,
      reasonCode: "INSUFFICIENT_COMPARABLE_REVENUE",
      requiresPrimaryReclassificationReview: false,
      qualitativeOverrideApplied: false,
    }
  }

  const exposureRevenue = input.exposureRevenue as number
  const comparableCompanyRevenue = input.comparableCompanyRevenue as number
  const revenueShare = exposureRevenue / comparableCompanyRevenue

  if (revenueShare > 1) {
    return {
      materiality: "UNKNOWN",
      revenueShare,
      reasonCode: "INCOMPARABLE_REVENUE",
      requiresPrimaryReclassificationReview: false,
      qualitativeOverrideApplied: false,
    }
  }

  const baseMateriality = quantitativeMateriality(revenueShare)
  if (override !== null && MATERIALITY_RANK[override.targetMateriality] > MATERIALITY_RANK[baseMateriality]) {
    return {
      materiality: override.targetMateriality,
      revenueShare,
      reasonCode: qualitativeReason(override.targetMateriality),
      requiresPrimaryReclassificationReview: override.targetMateriality === "DOMINANT",
      qualitativeOverrideApplied: true,
    }
  }

  return {
    materiality: baseMateriality,
    revenueShare,
    reasonCode: quantitativeReason(baseMateriality),
    requiresPrimaryReclassificationReview: baseMateriality === "DOMINANT",
    qualitativeOverrideApplied: false,
  }
}
