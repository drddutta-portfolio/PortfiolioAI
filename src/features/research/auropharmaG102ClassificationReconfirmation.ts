import {
  AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX,
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW,
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION,
  AUROPHARMA_G8_1_COMPARABILITY_CHECKS,
  AUROPHARMA_G8_1_IDENTITY,
  auropharmaApiRevenueSharePercent,
  auropharmaGlobalGenericsLowerBoundPercent,
} from "./auropharmaG8ClassificationEvidence"

export const AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION_VERSION =
  "AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION_V1" as const

const annualMix = AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX.map((row) => ({
  periodEnd: row.periodEnd,
  globalGenericsLowerBoundPercent: auropharmaGlobalGenericsLowerBoundPercent(row),
  apiSharePercent: auropharmaApiRevenueSharePercent(row),
}))

const primaryStillDominant = annualMix.every(
  (row) => row.globalGenericsLowerBoundPercent > 50,
)
const apiStillEmerging = annualMix.every(
  (row) => row.apiSharePercent >= 5 && row.apiSharePercent < 15,
)
const biosimilarsStillUnresolved =
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.unresolvedExposures.includes(
    "BIOPHARMA_BIOSIMILARS",
  )

if (
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.primary !== "GLOBAL_GENERICS"
  || !primaryStillDominant
  || !apiStillEmerging
  || !biosimilarsStillUnresolved
) {
  throw new Error(
    "G10.2 Checkpoint A re-confirmation no longer matches the reviewed AUROPHARMA classification authority",
  )
}

export const AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION = {
  version: AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION_VERSION,
  sourceClassificationVersion: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION,
  stage: "G10.2",
  checkpoint: "A",
  state: "READY_FOR_OWNER_RECONFIRMATION",
  identity: AUROPHARMA_G8_1_IDENTITY,
  evidenceThrough: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.evidenceThrough,
  effectiveFrom: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.proposedEffectiveFrom,
  primary: "GLOBAL_GENERICS",
  materialOverlays: [] as const,
  emergingWatches: ["API_BULK_DRUGS"] as const,
  unresolvedExposures: ["BIOPHARMA_BIOSIMILARS"] as const,
  annualMix,
  comparabilityChecks: AUROPHARMA_G8_1_COMPARABILITY_CHECKS,
  reReviewRequiredBecauseOfNewEvidence: false,
  classificationRebuiltFromScratch: false,
  scoreExecutionEnabled: false,
  recommendationExecutionEnabled: false,
  persistenceEnabled: false,
  scoreStateBeforeCheckpointB: "SCORE_NOT_COMPUTABLE",
  scoreBlocker: "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE",
  reclassificationRule:
    "The G8.1 reviewed classification is re-confirmed, not re-shaped by the future G10.2 score. New material business evidence requires a separately versioned classification review.",
} as const
