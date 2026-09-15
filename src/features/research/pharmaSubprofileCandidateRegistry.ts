import type { PharmaSubprofileCode, ResearchSubprofileConfidence } from "./pharmaSubprofileAssignment"

const CANDIDATE_SOURCE = "OWNER_SUPPLIED_R4N_REVIEW_SET_2026_09_15"

const CANDIDATES_BY_SUBPROFILE = {
  API_BULK_DRUGS: ["ALIVUS", "SUPRIYA", "SOLARA", "PAR"],
  DOMESTIC_FORMULATIONS: ["TORNTPHARM", "SUNPHARMA", "ERIS", "EMCURE", "MANKIND"],
  GLOBAL_GENERICS: ["CAPLIPOINT", "AUROPHARMA", "GRANULES", "GLENMARK", "WOCKPHARMA", "ZYDUSLIFE", "LUPIN", "CIPLA", "NATCOPHARM"],
  BIOPHARMA_BIOSIMILARS: ["BIOCON"],
  CDMO_CRAMS: ["LAURUSLABS", "ONESOURCE", "PPLPHARMA", "AKUMS", "SYNGENE", "JUBLPHARMA"],
} as const satisfies Readonly<Record<PharmaSubprofileCode, readonly string[]>>

export interface PharmaSubprofileCandidate {
  readonly symbol: string
  readonly profileCode: "PHARMA_V1"
  readonly proposedPrimarySubprofileCode: PharmaSubprofileCode
  readonly reviewState: "PROVISIONAL"
  readonly proposedEffectiveFrom: null
  readonly sourceReference: string
  readonly reasonCode: "OWNER_PROPOSED_REVIEW_CANDIDATE"
  readonly confidence: ResearchSubprofileConfidence
  readonly proposedSecondaryExposures: readonly PharmaSubprofileCode[]
}

function provisionalCandidate(symbol: string, proposedPrimarySubprofileCode: PharmaSubprofileCode): PharmaSubprofileCandidate {
  return {
    symbol,
    profileCode: "PHARMA_V1",
    proposedPrimarySubprofileCode,
    reviewState: "PROVISIONAL",
    proposedEffectiveFrom: null,
    sourceReference: CANDIDATE_SOURCE,
    reasonCode: "OWNER_PROPOSED_REVIEW_CANDIDATE",
    confidence: "LOW",
    proposedSecondaryExposures: [],
  }
}

export const PHARMA_SUBPROFILE_CANDIDATE_REGISTRY: readonly PharmaSubprofileCandidate[] = Object.entries(CANDIDATES_BY_SUBPROFILE)
  .flatMap(([subprofile, symbols]) => symbols.map((symbol) => provisionalCandidate(symbol, subprofile as PharmaSubprofileCode)))

export const OUTSIDE_PHARMA_V1_CANDIDATES = [{
  symbol: "ZYDUSWELL",
  reviewState: "CONSUMER_HEALTH_REVIEW",
  sourceReference: CANDIDATE_SOURCE,
  reasonCode: "OUTSIDE_CONVENTIONAL_PHARMA_METHODOLOGY",
}] as const
