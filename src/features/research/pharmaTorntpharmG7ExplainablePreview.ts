import {
  calculatePharmaG7Dimension,
  PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
  type PharmaG7DimensionAdapterInput,
  type PharmaG7DimensionCode,
  type PharmaG7DimensionCalculationState,
  type PharmaG7MethodologyState,
} from "./pharmaG7ReadOnlyScoringAdapter"
import {
  pharmaG6CurveContractForPrimary,
  PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION,
  type PharmaG6CurveFamily,
} from "./pharmaG6SubprofileCurveApplicability"
import {
  PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE,
} from "./pharmaDomesticValuationCombinedScoreContract"
import {
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
} from "./pharmaDomesticGateGFinal2NumericMethodology"
import {
  PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
} from "./pharmaG7OverlayNumericModifierProposal"
import type {
  PharmaResearchWorkspaceModel,
  PharmaWorkspaceRequirement,
} from "./pharmaResearchWorkspaceModel"

export const TORNTPHARM_G7_EXPLAINABLE_PREVIEW_VERSION =
  "TORNTPHARM_G7_EXPLAINABLE_READ_ONLY_PREVIEW_V1_PROPOSAL" as const

export type TorntpharmG7PreviewState =
  | "READY"
  | "PARTIAL"
  | "NOT_CURRENTLY_COMPUTABLE"

export interface TorntpharmG7PreviewRow {
  readonly dimensionCode: PharmaG7DimensionCode
  readonly methodologyState: PharmaG7MethodologyState
  readonly calculationState: PharmaG7DimensionCalculationState
  readonly primaryEvidenceVerified: number
  readonly primaryEvidenceTotal: number
  readonly overlayState: "NONE" | "READY" | "PARTIAL" | "INSUFFICIENT_EVIDENCE"
  readonly primaryScore: number | null
  readonly overlayModifierPoints: number | null
  readonly finalScore: number | null
  readonly reasonCodes: readonly string[]
  readonly methodologyLineage: readonly {
    readonly decisionId: string
    readonly contractVersion: string
  }[]
}

export interface TorntpharmG7ExplainablePreview {
  readonly contractVersion: typeof TORNTPHARM_G7_EXPLAINABLE_PREVIEW_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly securitySymbol: "TORNTPHARM"
  readonly primarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly materialOverlay: "GLOBAL_GENERICS"
  readonly emergingWatch: "CDMO_CRAMS"
  readonly overallPreviewState: TorntpharmG7PreviewState
  readonly overallScore: null
  readonly governanceRuntimeInputResolved: false
  readonly rows: readonly TorntpharmG7PreviewRow[]
  readonly reasonCodes: readonly string[]
  readonly adapterVersion: typeof PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION
  readonly scoreExecutionEnabled: false
  readonly persistedScoreRunEnabled: false
}

const DIMENSIONS: readonly PharmaG7DimensionCode[] = [
  "QUALITY",
  "GROWTH",
  "CAPITAL_EFFICIENCY",
  "CASH_FLOW",
  "BALANCE_SHEET_CREDIT",
  "BUSINESS_DURABILITY",
  "VALUATION",
  "MOMENTUM",
  "OWNERSHIP_GOVERNANCE",
  "RISK",
]

const FAMILY_BY_DIMENSION: Partial<Record<PharmaG7DimensionCode, PharmaG6CurveFamily>> = {
  QUALITY: "OPERATING_MARGIN",
  GROWTH: "SEGMENT_GROWTH",
  CAPITAL_EFFICIENCY: "ROCE_CAPITAL_EFFICIENCY",
  CASH_FLOW: "CASH_CONVERSION",
  BALANCE_SHEET_CREDIT: "BALANCE_SHEET_LEVERAGE",
  VALUATION: "VALUATION",
  MOMENTUM: "MOMENTUM",
  OWNERSHIP_GOVERNANCE: "OWNERSHIP_GOVERNANCE",
  RISK: "REGULATORY_MARKET_RISK",
}

function canonicalDimension(value: string): PharmaG7DimensionCode | null {
  if (value === "QUALITY") return "QUALITY"
  if (value === "GROWTH") return "GROWTH"
  if (value === "CAPITAL_EFFICIENCY") return "CAPITAL_EFFICIENCY"
  if (value === "EARNINGS_CASH_QUALITY" || value === "CASH_FLOW") return "CASH_FLOW"
  if (value === "FINANCIAL_STRENGTH" || value === "BALANCE_SHEET_CREDIT") return "BALANCE_SHEET_CREDIT"
  if (value === "BUSINESS_DURABILITY") return "BUSINESS_DURABILITY"
  if (value === "VALUATION") return "VALUATION"
  if (value === "MOMENTUM") return "MOMENTUM"
  if (value === "GOVERNANCE" || value === "OWNERSHIP_GOVERNANCE") return "OWNERSHIP_GOVERNANCE"
  if (value === "RISK") return "RISK"
  return null
}

function requirementsForDimension(
  requirements: readonly PharmaWorkspaceRequirement[],
  dimensionCode: PharmaG7DimensionCode,
) {
  return requirements.filter((item) => canonicalDimension(item.dimension) === dimensionCode)
}

function evidenceCoverage(requirements: readonly PharmaWorkspaceRequirement[]) {
  if (!requirements.length) return null
  const verified = requirements.filter((item) => item.status === "VERIFIED").length
  return verified / requirements.length
}

function mandatorySatisfied(requirements: readonly PharmaWorkspaceRequirement[]) {
  return !requirements.some(
    (item) => item.requirementLevel === "MANDATORY" && item.status !== "VERIFIED",
  )
}

function overlayReadinessForDimension(
  model: PharmaResearchWorkspaceModel,
  dimensionCode: PharmaG7DimensionCode,
): "NONE" | "READY" | "PARTIAL" | "INSUFFICIENT_EVIDENCE" {
  const material = model.secondaries.find(
    (item) => item.exposureCode === "GLOBAL_GENERICS" && item.mode === "EVIDENCE_OVERLAY",
  )
  if (!material) return "NONE"

  const requirements = requirementsForDimension(material.requirements, dimensionCode)
  if (!requirements.length) return "NONE"

  const verified = requirements.filter((item) => item.status === "VERIFIED").length
  if (verified === requirements.length) return "READY"
  if (verified > 0) return "PARTIAL"
  return "INSUFFICIENT_EVIDENCE"
}

const G_FINAL_2_APPROVED_DIMENSIONS = new Set<PharmaG7DimensionCode>([
  "CAPITAL_EFFICIENCY",
  "CASH_FLOW",
  "BALANCE_SHEET_CREDIT",
  "BUSINESS_DURABILITY",
  "MOMENTUM",
  "OWNERSHIP_GOVERNANCE",
  "RISK",
])

function methodologyStateForDimension(
  dimensionCode: PharmaG7DimensionCode,
): {
  readonly state: PharmaG7MethodologyState
  readonly contractVersion: string | null
  readonly decisionId: string
} {
  if (G_FINAL_2_APPROVED_DIMENSIONS.has(dimensionCode)) {
    return {
      state: "APPROVED_NUMERIC_CONTRACT",
      contractVersion: PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
      decisionId: "G_FINAL_2_DOMESTIC_NUMERIC_METHODOLOGY",
    }
  }

  if (dimensionCode === "VALUATION") {
    return {
      state: "APPROVED_NUMERIC_CONTRACT",
      contractVersion: PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.contractVersion,
      decisionId: "G6.17",
    }
  }

  const family = FAMILY_BY_DIMENSION[dimensionCode]
  if (!family) {
    return {
      state: "NO_APPROVED_DIMENSION_AGGREGATION",
      contractVersion: null,
      decisionId: "G7.2_NO_DIMENSION_METHOD",
    }
  }

  const primary = pharmaG6CurveContractForPrimary("DOMESTIC_FORMULATIONS")
  const entry = primary.entries.find((item) => item.family === family)
  if (!entry) {
    return {
      state: "NO_APPROVED_DIMENSION_AGGREGATION",
      contractVersion: null,
      decisionId: "G7.2_NO_G6_FAMILY",
    }
  }

  return {
    state: entry.state,
    contractVersion: entry.curveVersion,
    decisionId: `G6_${family}`,
  }
}

function adapterInputForDimension(
  model: PharmaResearchWorkspaceModel,
  dimensionCode: PharmaG7DimensionCode,
): PharmaG7DimensionAdapterInput {
  const primaryRequirements = requirementsForDimension(
    model.primary.requirements,
    dimensionCode,
  )
  const coverage = evidenceCoverage(primaryRequirements)
  const overlayState = overlayReadinessForDimension(model, dimensionCode)
  const method = methodologyStateForDimension(dimensionCode)
  const materialOverlayEligible =
    dimensionCode === "GROWTH"
    || dimensionCode === "BUSINESS_DURABILITY"
    || dimensionCode === "RISK"

  return {
    dimensionCode,
    methodologyState: method.state,
    readiness: {
      applicable: true,
      profileResolved: true,
      scoreReadyCoverage: coverage,
      mandatoryBlockingConditionsSatisfied: mandatorySatisfied(primaryRequirements),
      reviewBlocked: primaryRequirements.some(
        (item) =>
          item.status === "CONFLICTING"
          || item.status === "AMBIGUOUS"
          || item.status === "REVIEW_REQUIRED",
      ),
      overlayReadiness:
        materialOverlayEligible && overlayState !== "NONE"
          ? overlayState
          : "NONE",
    },
    primaryScore: null,
    primaryScoreContractVersion: method.contractVersion,
    overlayParticipation:
      materialOverlayEligible ? "ELIGIBLE" : "NONE",
    overlayModifierPoints: null,
    overlayModifierContractVersion:
      materialOverlayEligible ? PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION : null,
    methodologyLineage: [
      {
        decisionId: method.decisionId,
        contractVersion:
          method.contractVersion
          ?? PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION,
      },
    ],
  }
}

function assertTorntpharmArchitecture(model: PharmaResearchWorkspaceModel) {
  if (model.primary.subprofileCode !== "DOMESTIC_FORMULATIONS") {
    throw new Error("TORNTPHARM G7.2 preview requires Domestic Formulations Primary")
  }

  const global = model.secondaries.find((item) => item.exposureCode === "GLOBAL_GENERICS")
  if (!global || global.mode !== "EVIDENCE_OVERLAY") {
    throw new Error("TORNTPHARM G7.2 preview requires Global Generics Material Overlay")
  }

  const cdmo = model.secondaries.find((item) => item.exposureCode === "CDMO_CRAMS")
  if (!cdmo || cdmo.mode !== "EMERGING_WATCH") {
    throw new Error("TORNTPHARM G7.2 preview requires CDMO/CRAMS Emerging Watch")
  }
}

export function buildTorntpharmG7ExplainablePreview(
  model: PharmaResearchWorkspaceModel,
): TorntpharmG7ExplainablePreview {
  assertTorntpharmArchitecture(model)

  const rows = DIMENSIONS.map((dimensionCode): TorntpharmG7PreviewRow => {
    const input = adapterInputForDimension(model, dimensionCode)
    const result = calculatePharmaG7Dimension(input)
    const primaryRequirements = requirementsForDimension(
      model.primary.requirements,
      dimensionCode,
    )
    const overlayState = overlayReadinessForDimension(model, dimensionCode)

    return {
      dimensionCode,
      methodologyState: input.methodologyState,
      calculationState: result.calculationState,
      primaryEvidenceVerified: primaryRequirements.filter(
        (item) => item.status === "VERIFIED",
      ).length,
      primaryEvidenceTotal: primaryRequirements.length,
      overlayState,
      primaryScore: result.primaryScore,
      overlayModifierPoints: result.overlayModifierPoints,
      finalScore: result.finalScore,
      reasonCodes: result.reasonCodes,
      methodologyLineage: result.methodologyLineage,
    }
  })

  const rowsWithNumericResult = rows.filter((row) => row.finalScore !== null).length
  const rowsWithEvidence = rows.filter((row) => row.primaryEvidenceTotal > 0).length

  return {
    contractVersion: TORNTPHARM_G7_EXPLAINABLE_PREVIEW_VERSION,
    state: "PROPOSAL_ONLY",
    securitySymbol: "TORNTPHARM",
    primarySubprofile: "DOMESTIC_FORMULATIONS",
    materialOverlay: "GLOBAL_GENERICS",
    emergingWatch: "CDMO_CRAMS",
    overallPreviewState:
      rowsWithNumericResult === DIMENSIONS.length ? "READY"
        : rowsWithNumericResult > 0 ? "PARTIAL"
          : "NOT_CURRENTLY_COMPUTABLE",
    overallScore: null,
    governanceRuntimeInputResolved: false,
    rows,
    reasonCodes: [
      "GOVERNANCE_RUNTIME_INPUT_NOT_CANONICALLY_RESOLVED",
      rowsWithEvidence < DIMENSIONS.length
        ? "PRIMARY_DIMENSION_EVIDENCE_COVERAGE_NOT_AVAILABLE_FOR_ALL_WEIGHTED_DIMENSIONS"
        : "PRIMARY_DIMENSION_EVIDENCE_PRESENT",
      rowsWithNumericResult < DIMENSIONS.length
        ? "ONE_OR_MORE_WEIGHTED_DIMENSIONS_HAVE_NO_NUMERIC_RESULT"
        : "ALL_WEIGHTED_DIMENSIONS_HAVE_NUMERIC_RESULT",
      "NO_HIDDEN_REWEIGHTING",
      "NO_OVERALL_SCORE_EMITTED",
    ],
    adapterVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
    scoreExecutionEnabled: false,
    persistedScoreRunEnabled: false,
  }
}
