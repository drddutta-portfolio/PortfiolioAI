import { evaluatePharmaGateI3ReadOnlyRecommendation } from "./pharmaGateI3ReadOnlyRecommendation"
import { buildPharmaRecommendationInput, buildPharmaReferenceScoreAuthority } from "./pharmaRecommendationAuthority"
import type { PharmaSubprofileResolution } from "./pharmaSubprofileAssignment"
import { ALIVUS_G10_1_READ_ONLY_SCORE_RESULT } from "./alivusG101ReadOnlyScore"

export const ALIVUS_G10_1_REFERENCE_SECURITY_ID = "G10_1_ALIVUS_REFERENCE" as const

export const ALIVUS_G10_1_REFERENCE_ASSIGNMENT_RESOLUTION: PharmaSubprofileResolution = {
  status: "RESOLVED",
  profileCode: "PHARMA_V1",
  blocksReadiness: false,
  assignment: {
    securityId: ALIVUS_G10_1_REFERENCE_SECURITY_ID,
    profileCode: "PHARMA_V1",
    primarySubprofileCode: "API_BULK_DRUGS",
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "ALIVUS_G10_1_API_CLASSIFICATION_LOCK_V1",
    reasonCode: "G10_1_OWNER_VALIDATED_CLASSIFICATION_LOCK",
    confidence: "HIGH",
    reviewedBy: "OWNER_LOCALHOST_LOCK",
    reviewedAt: "2026-09-21T10:12:00+05:30",
    secondaryExposures: [{
      exposureCode: "CDMO_CRAMS",
      materiality: "EMERGING",
      confidence: "HIGH",
      assignmentState: "REVIEWED",
      effectiveFrom: "2026-03-31",
      effectiveTo: null,
      sourceReference: "ALIVUS_G10_1_API_CLASSIFICATION_LOCK_V1",
      reasonCode: "G10_1_CDMO_EMERGING_6_TO_7_PERCENT",
      reviewedBy: "OWNER_LOCALHOST_LOCK",
      reviewedAt: "2026-09-21T10:12:00+05:30",
    }],
  },
}

const scoreAuthority = buildPharmaReferenceScoreAuthority(
  ALIVUS_G10_1_REFERENCE_SECURITY_ID,
  ALIVUS_G10_1_READ_ONLY_SCORE_RESULT,
)

export const ALIVUS_G10_1_READ_ONLY_RECOMMENDATION =
  evaluatePharmaGateI3ReadOnlyRecommendation(
    buildPharmaRecommendationInput({
      securityId: ALIVUS_G10_1_REFERENCE_SECURITY_ID,
      assignmentResolution: ALIVUS_G10_1_REFERENCE_ASSIGNMENT_RESOLUTION,
      scoreAuthority,
    }),
  )
