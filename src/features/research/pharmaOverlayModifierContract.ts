import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type { PharmaSubprofileCode } from "./pharmaSubprofileAssignment"

export const PHARMA_OVERLAY_MODIFIER_CONTRACT_VERSION =
  "PHARMA_V1_OVERLAY_MODIFIER_V1_PROPOSAL" as const

export const PHARMA_OVERLAY_MODIFIER_CONTRACT = {
  version: PHARMA_OVERLAY_MODIFIER_CONTRACT_VERSION,
  state: "PROPOSAL_ONLY",
  materialOverlayMinimumPercent: 15,
  materialityScalingInputRequired: true,
  evidenceCompletenessInputRequired: true,
  evidenceConfidenceInputRequired: true,
  normalizedOverlaySignalRequired: true,
  combinedPerDimensionCapRequired: true,
  combinedPerDimensionCapValue: null,
  independentOverlayCapStackingAllowed: false,
  secondStockScoreAllowed: false,
  emergingWatchNumericParticipationAllowed: false,
  missingEvidenceMayBecomeNeutralModifier: false,
  unresolvedContradictionMayModify: false,
  modifierFormulaState: "UNAPPROVED",
  scoreExecutionEnabled: false,
} as const

export type PharmaOverlayDimensionCode =
  | "QUALITY"
  | "GROWTH"
  | "CAPITAL_EFFICIENCY"
  | "CASH_FLOW"
  | "BALANCE_SHEET_CREDIT"
  | "BUSINESS_DURABILITY"
  | "VALUATION"
  | "MOMENTUM"
  | "OWNERSHIP_GOVERNANCE"
  | "RISK"

export type PharmaOverlayRole =
  | "MATERIAL_OVERLAY"
  | "EMERGING_WATCH"
  | "BELOW_SCORING_MATERIALITY"
  | "REVIEW_REQUIRED"

export type PharmaOverlayEvidenceConfidence = "LOW" | "MEDIUM" | "HIGH"

export type PharmaOverlayContradictionState =
  | "NONE"
  | "RESOLVED_BY_VERSIONED_CONTRACT"
  | "UNRESOLVED"

export interface PharmaOverlayModifierInput {
  readonly overlayCode: PharmaSubprofileCode
  readonly overlayRole: PharmaOverlayRole
  readonly dimensionCode: PharmaOverlayDimensionCode
  readonly economicMaterialityPercent: number | null
  readonly evidenceCompleteness: number | null
  readonly evidenceConfidence: PharmaOverlayEvidenceConfidence | null
  readonly normalizedOverlaySignal: number | null
  readonly contradictionState: PharmaOverlayContradictionState
}

export type PharmaOverlayModifierState =
  | "ELIGIBLE_PENDING_NUMERIC_CONTRACT"
  | "EXCLUDED_EMERGING_WATCH"
  | "NOT_ELIGIBLE_DIMENSION"
  | "PARTIAL_EVIDENCE"
  | "REVIEW_REQUIRED"
  | "BELOW_SCORING_MATERIALITY"

export interface PharmaOverlayModifierProposal {
  readonly contractVersion: typeof PHARMA_OVERLAY_MODIFIER_CONTRACT_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly modifierState: PharmaOverlayModifierState
  readonly overlayCode: PharmaSubprofileCode
  readonly dimensionCode: PharmaOverlayDimensionCode
  readonly eligibleDimensions: readonly PharmaOverlayDimensionCode[]
  readonly numericModifier: null
  readonly combinedPerDimensionCapValue: null
  readonly reasonCodes: readonly string[]
  readonly scoreExecutionEnabled: false
}

const DIMENSION_MAP = {
  QUALITY: "QUALITY",
  GROWTH: "GROWTH",
  EARNINGS_CASH_QUALITY: "CASH_FLOW",
  FINANCIAL_STRENGTH: "BALANCE_SHEET_CREDIT",
  BUSINESS_DURABILITY: "BUSINESS_DURABILITY",
  VALUATION: "VALUATION",
  GOVERNANCE: "OWNERSHIP_GOVERNANCE",
  RISK: "RISK",
} as const satisfies Readonly<Record<string, PharmaOverlayDimensionCode>>

function mappedDimension(value: string): PharmaOverlayDimensionCode | null {
  return DIMENSION_MAP[value as keyof typeof DIMENSION_MAP] ?? null
}

function assertRatio(value: number | null, label: string) {
  if (value === null) return
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1`)
}

function assertPercent(value: number | null, label: string) {
  if (value === null) return
  if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${label} must be between 0 and 100`)
}

function assertNormalizedSignal(value: number | null) {
  if (value === null) return
  if (!Number.isFinite(value) || value < -1 || value > 1) throw new Error("normalizedOverlaySignal must be between -1 and 1")
}

export function getPharmaOverlayEligibleDimensions(
  overlayCode: PharmaSubprofileCode,
): readonly PharmaOverlayDimensionCode[] {
  const subprofile = PHARMA_SUBPROFILE_CONTRACTS[overlayCode]
  const parentMetrics = new Map(PHARMA_RESEARCH_PROFILE_V1.metrics.map((metric) => [metric.metricCode, metric]))
  const dimensions = new Set<PharmaOverlayDimensionCode>()

  for (const addition of subprofile.additions) {
    const dimension = mappedDimension(addition.dimension)
    if (dimension) dimensions.add(dimension)
  }

  for (const override of subprofile.overrides) {
    const parent = parentMetrics.get(override.metricCode)
    if (!parent) throw new Error(`Unknown PHARMA_V1 override metric: ${override.metricCode}`)
    const dimension = mappedDimension(parent.dimension)
    if (dimension) dimensions.add(dimension)
  }

  return [...dimensions].sort()
}

function proposal(
  input: PharmaOverlayModifierInput,
  modifierState: PharmaOverlayModifierState,
  reasonCodes: readonly string[],
): PharmaOverlayModifierProposal {
  return {
    contractVersion: PHARMA_OVERLAY_MODIFIER_CONTRACT_VERSION,
    state: "PROPOSAL_ONLY",
    modifierState,
    overlayCode: input.overlayCode,
    dimensionCode: input.dimensionCode,
    eligibleDimensions: getPharmaOverlayEligibleDimensions(input.overlayCode),
    numericModifier: null,
    combinedPerDimensionCapValue: null,
    reasonCodes,
    scoreExecutionEnabled: false,
  }
}

export function buildPharmaOverlayModifierProposal(
  input: PharmaOverlayModifierInput,
): PharmaOverlayModifierProposal {
  assertPercent(input.economicMaterialityPercent, "economicMaterialityPercent")
  assertRatio(input.evidenceCompleteness, "evidenceCompleteness")
  assertNormalizedSignal(input.normalizedOverlaySignal)

  if (input.overlayRole === "EMERGING_WATCH") {
    return proposal(input, "EXCLUDED_EMERGING_WATCH", ["EMERGING_WATCH_NUMERICALLY_EXCLUDED"])
  }

  if (input.overlayRole === "BELOW_SCORING_MATERIALITY") {
    return proposal(input, "BELOW_SCORING_MATERIALITY", ["BELOW_SCORING_MATERIALITY"])
  }

  if (input.overlayRole === "REVIEW_REQUIRED") {
    return proposal(input, "REVIEW_REQUIRED", ["OVERLAY_CLASSIFICATION_REVIEW_REQUIRED"])
  }

  const eligibleDimensions = getPharmaOverlayEligibleDimensions(input.overlayCode)
  if (!eligibleDimensions.includes(input.dimensionCode)) {
    return proposal(input, "NOT_ELIGIBLE_DIMENSION", ["DIMENSION_NOT_TOUCHED_BY_OVERLAY_CONTRACT"])
  }

  if (
    input.economicMaterialityPercent === null
    || input.economicMaterialityPercent < PHARMA_OVERLAY_MODIFIER_CONTRACT.materialOverlayMinimumPercent
  ) {
    return proposal(input, "REVIEW_REQUIRED", ["MATERIAL_OVERLAY_REQUIRES_REVIEWED_MATERIALITY"])
  }

  if (input.contradictionState === "UNRESOLVED") {
    return proposal(input, "REVIEW_REQUIRED", ["UNRESOLVED_OVERLAY_CONTRADICTION"])
  }

  const missingInputs = [
    input.evidenceCompleteness === null ? "MISSING_EVIDENCE_COMPLETENESS" : null,
    input.evidenceConfidence === null ? "MISSING_EVIDENCE_CONFIDENCE" : null,
    input.normalizedOverlaySignal === null ? "MISSING_NORMALIZED_OVERLAY_SIGNAL" : null,
  ].filter((reason): reason is string => reason !== null)

  if (missingInputs.length) {
    return proposal(input, "PARTIAL_EVIDENCE", missingInputs)
  }

  return proposal(input, "ELIGIBLE_PENDING_NUMERIC_CONTRACT", [
    "OVERLAY_INPUTS_COMPLETE",
    "NUMERIC_FORMULA_AND_COMBINED_CAP_VALUE_UNAPPROVED",
  ])
}
