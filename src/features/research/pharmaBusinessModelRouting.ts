import { PHARMA_BUSINESS_MODEL_PROFILES, type PharmaBusinessModelCode, type PharmaBusinessModelProfile } from "./pharmaBusinessModelProfiles"

export type PharmaBusinessModelRoutingState = "REVIEWED" | "REVIEW_REQUIRED" | "NOT_APPLICABLE"

export interface PharmaBusinessModelRoutingInput {
  readonly canonicalSector: string | null
  readonly reviewedBusinessModelCode: string | null
}

export interface PharmaBusinessModelRoutingResult {
  readonly state: PharmaBusinessModelRoutingState
  readonly profile: PharmaBusinessModelProfile | null
  readonly reason: string
}

function isKnownCode(value: string): value is PharmaBusinessModelCode {
  return PHARMA_BUSINESS_MODEL_PROFILES.some((profile) => profile.code === value)
}

/**
 * Business-model routing is intentionally evidence/review driven. It never uses
 * ticker symbols, company names or ad-hoc page mappings as a hidden classifier.
 * A Pharma security without a reviewed business-model assignment remains
 * REVIEW_REQUIRED while still retaining the PHARMA_V1 parent contract.
 */
export function resolvePharmaBusinessModel(input: PharmaBusinessModelRoutingInput): PharmaBusinessModelRoutingResult {
  if (input.canonicalSector !== "Pharma") {
    return {
      state: "NOT_APPLICABLE",
      profile: null,
      reason: "Canonical application sector is not Pharma.",
    }
  }

  if (!input.reviewedBusinessModelCode) {
    return {
      state: "REVIEW_REQUIRED",
      profile: null,
      reason: "PHARMA_V1 parent methodology applies, but a reviewed Pharma business-model subprofile has not yet been assigned.",
    }
  }

  if (!isKnownCode(input.reviewedBusinessModelCode)) {
    return {
      state: "REVIEW_REQUIRED",
      profile: null,
      reason: `Reviewed value ${input.reviewedBusinessModelCode} is not a recognized Pharma business-model contract.`,
    }
  }

  const profile = PHARMA_BUSINESS_MODEL_PROFILES.find((item) => item.code === input.reviewedBusinessModelCode) ?? null
  return {
    state: "REVIEWED",
    profile,
    reason: `Reviewed Pharma business-model subprofile: ${profile?.displayName ?? input.reviewedBusinessModelCode}.`,
  }
}
