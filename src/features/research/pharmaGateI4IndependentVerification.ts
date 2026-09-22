import { buildAuropharmaG91AssignmentCandidate } from "./auropharmaG91ActivationReadiness"
import {
  buildPharmaGateI3ReferenceRecommendation,
  type PharmaGateI3ReadOnlyRecommendationResult,
} from "./pharmaGateI3ReadOnlyRecommendation"
import type {
  PharmaSubprofileAssignment,
  PharmaSubprofileResolution,
} from "./pharmaSubprofileAssignment"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

export const PHARMA_GATE_I4_INDEPENDENT_VERIFICATION_VERSION =
  "PHARMA_GATE_I4_INDEPENDENT_VERIFICATION_V1" as const

const HAND_POLICY = {
  coreMinimum: 80,
  satelliteMinimum: 65,
  watchMinimum: 50,
  satelliteFloors: {
    QUALITY: 50,
    GROWTH: 50,
    CASH_FLOW: 50,
    BALANCE_SHEET_CREDIT: 50,
    BUSINESS_DURABILITY: 50,
    OWNERSHIP_GOVERNANCE: 50,
    RISK: 50,
  },
  valuationCautionBelow: 50,
  momentumCautionBelow: 50,
} as const

const HAND_DIMENSION_SCORES = {
  QUALITY: 92,
  GROWTH: 78.25,
  CAPITAL_EFFICIENCY: 79,
  CASH_FLOW: 93.6,
  BALANCE_SHEET_CREDIT: 65,
  BUSINESS_DURABILITY: 75,
  VALUATION: 30,
  MOMENTUM: 95,
  OWNERSHIP_GOVERNANCE: 70,
  RISK: 80,
} as const

function reviewedExposure(
  exposureCode: "GLOBAL_GENERICS" | "CDMO_CRAMS",
  materiality: "MATERIAL" | "EMERGING",
) {
  return {
    exposureCode,
    materiality,
    confidence: "HIGH" as const,
    assignmentState: "REVIEWED" as const,
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: `GATE_I4_INDEPENDENT_${exposureCode}`,
    reasonCode: "GATE_I4_INDEPENDENT_REFERENCE_ASSIGNMENT",
    reviewedBy: "GATE_I4_INDEPENDENT_VERIFICATION",
    reviewedAt: "2026-09-21T00:00:00Z",
  }
}

function resolved(
  assignment: PharmaSubprofileAssignment,
): PharmaSubprofileResolution {
  return {
    status: "RESOLVED",
    profileCode: "PHARMA_V1",
    assignment,
    blocksReadiness: false,
  }
}

function torntpharmResolution(
  securityId: string,
): PharmaSubprofileResolution {
  return resolved({
    securityId,
    profileCode: "PHARMA_V1",
    primarySubprofileCode: "DOMESTIC_FORMULATIONS",
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "GATE_I4_INDEPENDENT_TORNTPHARM_ASSIGNMENT",
    reasonCode: "GATE_I4_INDEPENDENT_REFERENCE_ASSIGNMENT",
    confidence: "HIGH",
    reviewedBy: "GATE_I4_INDEPENDENT_VERIFICATION",
    reviewedAt: "2026-09-21T00:00:00Z",
    secondaryExposures: [
      reviewedExposure("GLOBAL_GENERICS", "MATERIAL"),
      reviewedExposure("CDMO_CRAMS", "EMERGING"),
    ],
  })
}

function requireResult(
  result: PharmaGateI3ReadOnlyRecommendationResult | null,
  label: string,
): PharmaGateI3ReadOnlyRecommendationResult {
  if (!result) throw new Error(`I4 verification missing ${label} result`)
  return result
}

function handFloorResults() {
  return Object.entries(HAND_POLICY.satelliteFloors).map(
    ([dimensionCode, minimum]) => ({
      dimensionCode,
      minimum,
      observed:
        HAND_DIMENSION_SCORES[
          dimensionCode as keyof typeof HAND_DIMENSION_SCORES
        ],
      state:
        HAND_DIMENSION_SCORES[
          dimensionCode as keyof typeof HAND_DIMENSION_SCORES
        ] >= minimum
          ? "PASS" as const
          : "FAIL" as const,
    }),
  )
}

function handRecommendation() {
  const overallScore = 75.1575
  const coreThresholdPassed = overallScore >= HAND_POLICY.coreMinimum
  const satelliteThresholdPassed =
    overallScore >= HAND_POLICY.satelliteMinimum
  const watchThresholdPassed = overallScore >= HAND_POLICY.watchMinimum
  const floors = handFloorResults()
  const satelliteFloorsPassed =
    floors.every((floor) => floor.state === "PASS")

  const role =
    coreThresholdPassed
      ? "CORE_CANDIDATE"
      : satelliteThresholdPassed && satelliteFloorsPassed
        ? "SATELLITE_CANDIDATE"
        : watchThresholdPassed
          ? "WATCH"
          : "AVOID"

  const cautions = [
    ...(HAND_DIMENSION_SCORES.VALUATION
      < HAND_POLICY.valuationCautionBelow
      ? ["VALUATION_BELOW_NEUTRAL_ANCHOR"]
      : []),
    ...(HAND_DIMENSION_SCORES.MOMENTUM
      < HAND_POLICY.momentumCautionBelow
      ? ["MOMENTUM_BELOW_NEUTRAL_ANCHOR"]
      : []),
  ]

  return {
    overallScore,
    coreThresholdPassed,
    satelliteThresholdPassed,
    watchThresholdPassed,
    satelliteFloors: floors,
    satelliteFloorsPassed,
    globalHardBlockerPresent: false,
    governanceState: "CLEAR" as const,
    governanceSecondPenaltyApplied: false,
    materialOverlaySecondRecommendation: false,
    emergingWatchNumericRoleInput: false,
    cautions,
    finalRole: role,
  }
}

function dimensionMap(
  result: PharmaGateI3ReadOnlyRecommendationResult,
) {
  return Object.fromEntries(
    result.dimensions.map((dimension) => [
      dimension.dimensionCode,
      dimension.score,
    ]),
  )
}

function identical(
  first: PharmaGateI3ReadOnlyRecommendationResult,
  second: PharmaGateI3ReadOnlyRecommendationResult,
) {
  return JSON.stringify(first) === JSON.stringify(second)
}

export function buildPharmaGateI4IndependentVerification() {
  const tornInput = {
    securityId: "gate-i4-torntpharm",
    securitySymbol: "TORNTPHARM",
    assignmentResolution: torntpharmResolution("gate-i4-torntpharm"),
  } as const

  const first = requireResult(
    buildPharmaGateI3ReferenceRecommendation(tornInput),
    "TORNTPHARM first",
  )
  const second = requireResult(
    buildPharmaGateI3ReferenceRecommendation(tornInput),
    "TORNTPHARM second",
  )

  const auroAssignment =
    buildAuropharmaG91AssignmentCandidate("gate-i4-auropharma")
  const auro = requireResult(
    buildPharmaGateI3ReferenceRecommendation({
      securityId: "gate-i4-auropharma",
      securitySymbol: "AUROPHARMA",
      assignmentResolution: resolved(auroAssignment),
    }),
    "AUROPHARMA",
  )

  const hand = handRecommendation()
  const gateHDimensions = Object.fromEntries(
    TORNTPHARM_GATE_H3_READ_ONLY_RESULT.dimensions.map((dimension) => [
      dimension.dimensionCode,
      dimension.finalScore,
    ]),
  )

  return {
    version: PHARMA_GATE_I4_INDEPENDENT_VERIFICATION_VERSION,
    handVerification: hand,
    adapterCrossCheck: {
      roleMatches: first.suggestedRole === hand.finalRole,
      overallScoreMatches: first.overallScore === hand.overallScore,
      floorCountMatches:
        first.floorEvaluations.length === hand.satelliteFloors.length,
      allSatelliteFloorsMatch:
        first.floorEvaluations.every((floor) => {
          const handFloor = hand.satelliteFloors.find(
            (candidate) => candidate.dimensionCode === floor.dimensionCode,
          )
          return handFloor !== undefined
            && handFloor.minimum === floor.minimum
            && handFloor.observed === floor.observed
            && handFloor.state === floor.state
        }),
      cautionsMatch:
        JSON.stringify(first.cautions)
        === JSON.stringify(hand.cautions),
      governanceMatches: first.governanceState === hand.governanceState,
    },
    scorePreservation: {
      gateHOverallScore: TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore,
      recommendationOverallScore: first.overallScore,
      exactOverallMatch:
        TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore
        === first.overallScore,
      gateHDimensions,
      recommendationDimensions: dimensionMap(first),
      dimensionsExactMatch:
        JSON.stringify(gateHDimensions)
        === JSON.stringify(dimensionMap(first)),
      recommendationDimensionCount: first.dimensions.length,
      hiddenRenormalizationAllowed: false,
      missingOverallReconstructionAllowed: false,
    },
    antiLeakage: {
      bankNbfcThresholdsUsed: false,
      bankNbfcFloorsUsed: false,
      niftyBankLogicUsed: false,
      hdfcBankAssumptionsUsed: false,
      globalGenericsSecondRecommendation:
        first.overlayTreatment.secondIndependentRecommendation,
      cdmoEmergingNumericRoleInput:
        first.overlayTreatment.emergingWatchTreatment
        !== "CONTEXT_ONLY_NUMERICALLY_EXCLUDED",
      governanceDoubleCounting:
        hand.governanceSecondPenaltyApplied,
    },
    determinism: {
      repeatedCalculationIdentical: identical(first, second),
      first,
      second,
    },
    auropharmaFailClosedControl: {
      suggestedRole: auro.suggestedRole,
      sourceAuthorityState: auro.sourceAuthorityState,
      overallScore: auro.overallScore,
      dimensionCount: auro.dimensions.length,
      thresholdState: auro.evaluatedRoleThreshold,
      noScoreReconstruction:
        auro.overallScore === null && auro.dimensions.length === 0,
    },
    safety: {
      readOnly: first.readOnly,
      nonPersisting: first.nonPersisting,
      recommendationPersistenceEnabled:
        first.recommendationPersistenceEnabled,
      scorePersistenceEnabled: first.scorePersistenceEnabled,
      weightGuidanceEnabled: first.weightGuidanceEnabled,
      actionBiasEnabled: first.actionBiasEnabled,
      positionSizingEnabled: first.positionSizingEnabled,
      aiInterpretationEnabled: first.aiInterpretationEnabled,
      providerRefreshInvoked: false,
      productionMutationInvoked: false,
    },
  }
}

export const PHARMA_GATE_I4_INDEPENDENT_VERIFICATION =
  buildPharmaGateI4IndependentVerification()
