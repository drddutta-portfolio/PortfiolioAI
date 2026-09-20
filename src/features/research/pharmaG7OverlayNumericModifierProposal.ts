import {
  buildPharmaOverlayModifierProposal,
  PHARMA_OVERLAY_MODIFIER_CONTRACT,
  type PharmaOverlayModifierInput,
} from "./pharmaOverlayModifierContract"

export const PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION =
  "PHARMA_V1_G7_OVERLAY_NUMERIC_MODIFIER_V1_OWNER_APPROVED" as const

export const PHARMA_G7_OVERLAY_NUMERIC_MODIFIER = {
  version: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
  state: "OWNER_APPROVED_NOT_ACTIVE",
  sourceOverlayContractVersion: PHARMA_OVERLAY_MODIFIER_CONTRACT.version,
  formula:
    "CAP_POINTS * (ECONOMIC_MATERIALITY_PERCENT / 100) * EVIDENCE_COMPLETENESS * CONFIDENCE_FACTOR * NORMALIZED_OVERLAY_SIGNAL",
  combinedPerDimensionCapPoints: 10,
  confidenceFactors: {
    LOW: 0.5,
    MEDIUM: 0.75,
    HIGH: 1,
  },
  materialityScaling: "DIRECT_ECONOMIC_SHARE",
  readinessRule: "READY_ONLY",
  partialReadinessNumericModifierAllowed: false,
  independentOverlayCapStackingAllowed: false,
  finalDimensionLowerBound: 0,
  finalDimensionUpperBound: 100,
  empiricallyCalibrated: false,
  methodologyApproved: true,
  ownerValidationRequired: false,
  g71ConsumptionApproved: true,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const

export type PharmaG7OverlayReadiness =
  | "READY"
  | "PARTIAL"
  | "INSUFFICIENT_EVIDENCE"
  | "BLOCKED_REVIEW"
  | "EMERGING_WATCH"

export interface PharmaG7OverlayNumericModifierInput extends PharmaOverlayModifierInput {
  readonly overlayReadiness: PharmaG7OverlayReadiness
}

export type PharmaG7OverlayNumericModifierState =
  | "APPROVED_NUMERIC_MODIFIER"
  | "INELIGIBLE_G2"
  | "READINESS_NOT_READY"
  | "EXCLUDED_EMERGING_WATCH"

export interface PharmaG7OverlayNumericModifierResult {
  readonly contractVersion: typeof PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION
  readonly state: "OWNER_APPROVED_NOT_ACTIVE"
  readonly modifierState: PharmaG7OverlayNumericModifierState
  readonly proposedNumericModifierPoints: number | null
  readonly combinedPerDimensionCapPoints: 10
  readonly reasonCodes: readonly string[]
  readonly ownerValidationRequired: false
  readonly g71ConsumptionApproved: true
  readonly scoreExecutionEnabled: false
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000
}

function result(
  modifierState: PharmaG7OverlayNumericModifierState,
  proposedNumericModifierPoints: number | null,
  reasonCodes: readonly string[],
): PharmaG7OverlayNumericModifierResult {
  return {
    contractVersion: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
    state: "OWNER_APPROVED_NOT_ACTIVE",
    modifierState,
    proposedNumericModifierPoints,
    combinedPerDimensionCapPoints:
      PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.combinedPerDimensionCapPoints,
    reasonCodes,
    ownerValidationRequired: false,
    g71ConsumptionApproved: true,
    scoreExecutionEnabled: false,
  }
}

export function buildPharmaG7OverlayNumericModifierProposal(
  input: PharmaG7OverlayNumericModifierInput,
): PharmaG7OverlayNumericModifierResult {
  if (input.overlayReadiness === "EMERGING_WATCH") {
    return result("EXCLUDED_EMERGING_WATCH", null, [
      "EMERGING_WATCH_NUMERICALLY_EXCLUDED",
    ])
  }

  const g2 = buildPharmaOverlayModifierProposal(input)
  if (g2.modifierState !== "ELIGIBLE_PENDING_NUMERIC_CONTRACT") {
    return result("INELIGIBLE_G2", null, g2.reasonCodes)
  }

  if (input.overlayReadiness !== "READY") {
    return result("READINESS_NOT_READY", null, [
      "OVERLAY_READINESS_MUST_BE_READY_FOR_NUMERIC_MODIFIER",
      `OVERLAY_READINESS_${input.overlayReadiness}`,
    ])
  }

  if (
    input.economicMaterialityPercent === null
    || input.evidenceCompleteness === null
    || input.evidenceConfidence === null
    || input.normalizedOverlaySignal === null
  ) {
    return result("INELIGIBLE_G2", null, ["G2_REQUIRED_INPUT_UNAVAILABLE"])
  }

  const materialityFactor = input.economicMaterialityPercent / 100
  const confidenceFactor =
    PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.confidenceFactors[input.evidenceConfidence]
  const rawModifier =
    PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.combinedPerDimensionCapPoints
    * materialityFactor
    * input.evidenceCompleteness
    * confidenceFactor
    * input.normalizedOverlaySignal

  const cap = PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.combinedPerDimensionCapPoints
  const cappedModifier = Math.max(-cap, Math.min(cap, rawModifier))

  return result("APPROVED_NUMERIC_MODIFIER", round(cappedModifier), [
    "G7_P1_OWNER_APPROVED_FORMULA_APPLIED",
    "DIRECT_ECONOMIC_SHARE_SCALING",
    "READY_OVERLAY_ONLY",
    "G7_1_READ_ONLY_CONSUMPTION_APPROVED",
  ])
}

export function combinePharmaG7OverlayModifiers(
  modifiers: readonly number[],
): number {
  if (modifiers.some((value) => !Number.isFinite(value))) {
    throw new Error("Overlay modifiers must be finite numbers")
  }
  const cap = PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.combinedPerDimensionCapPoints
  const total = modifiers.reduce((sum, value) => sum + value, 0)
  return round(Math.max(-cap, Math.min(cap, total)))
}

export function applyPharmaG7OverlayModifierToDimension(
  primaryDimensionScore: number,
  combinedOverlayModifier: number,
): number {
  if (!Number.isFinite(primaryDimensionScore) || primaryDimensionScore < 0 || primaryDimensionScore > 100) {
    throw new Error("primaryDimensionScore must be between 0 and 100")
  }
  if (!Number.isFinite(combinedOverlayModifier)) {
    throw new Error("combinedOverlayModifier must be finite")
  }
  const boundedModifier = combinePharmaG7OverlayModifiers([combinedOverlayModifier])
  return round(Math.max(
    PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.finalDimensionLowerBound,
    Math.min(
      PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.finalDimensionUpperBound,
      primaryDimensionScore + boundedModifier,
    ),
  ))
}
