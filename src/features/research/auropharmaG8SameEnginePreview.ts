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
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW,
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION,
} from "./auropharmaG8ClassificationEvidence"
import {
  buildPharmaThreeLayerResearchArchitecture,
  type PharmaThreeLayerResearchArchitecture,
} from "./pharmaThreeLayerResearchArchitecture"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"
import type {
  PharmaResearchWorkspaceModel,
  PharmaWorkspaceRequirement,
} from "./pharmaResearchWorkspaceModel"
import { buildPharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"
import type { ResearchMetric } from "./types"

export const AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION =
  "AUROPHARMA_G8_2_SAME_ENGINE_READ_ONLY_PREVIEW_V1" as const

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

function previewAssignment(securityId: string): PharmaSubprofileAssignment {
  return {
    securityId,
    profileCode: "PHARMA_V1",
    primarySubprofileCode: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.primary,
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.proposedEffectiveFrom,
    effectiveTo: null,
    sourceReference: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION,
    reasonCode: "G8_1_OWNER_VALIDATED_READ_ONLY_PREVIEW",
    confidence: "HIGH",
    reviewedBy: "G8.1_OWNER_VALIDATED",
    reviewedAt: "2026-09-19T18:30:00Z",
    secondaryExposures: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.emergingWatches.map(
      (exposureCode) => ({
        exposureCode,
        materiality: "EMERGING" as const,
        confidence: "HIGH" as const,
        assignmentState: "REVIEWED" as const,
        effectiveFrom: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.proposedEffectiveFrom,
        effectiveTo: null,
        sourceReference: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION,
        reasonCode: "G8_1_ECONOMIC_SHARE_5_TO_LT_15",
        reviewedBy: "G8.1_OWNER_VALIDATED",
        reviewedAt: "2026-09-19T18:30:00Z",
      }),
    ),
  }
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
  return requirements.filter((item) => item.status === "VERIFIED").length / requirements.length
}

function mandatorySatisfied(requirements: readonly PharmaWorkspaceRequirement[]) {
  return !requirements.some(
    (item) => item.requirementLevel === "MANDATORY" && item.status !== "VERIFIED",
  )
}

function methodologyForDimension(
  model: PharmaResearchWorkspaceModel,
  dimensionCode: PharmaG7DimensionCode,
): {
  readonly state: PharmaG7MethodologyState
  readonly contractVersion: string | null
  readonly decisionId: string
} {
  if (dimensionCode === "BUSINESS_DURABILITY") {
    return {
      state: "NO_APPROVED_DIMENSION_AGGREGATION",
      contractVersion: null,
      decisionId: "G8.2_BUSINESS_DURABILITY_NO_AGGREGATION",
    }
  }

  const family = FAMILY_BY_DIMENSION[dimensionCode]
  if (!family) {
    return {
      state: "NO_APPROVED_DIMENSION_AGGREGATION",
      contractVersion: null,
      decisionId: "G8.2_NO_DIMENSION_METHOD",
    }
  }

  const primaryContract = pharmaG6CurveContractForPrimary(model.primary.subprofileCode)
  const entry = primaryContract.entries.find((item) => item.family === family)
  if (!entry) {
    return {
      state: "NO_APPROVED_DIMENSION_AGGREGATION",
      contractVersion: null,
      decisionId: "G8.2_NO_G6_FAMILY",
    }
  }

  return {
    state: entry.state,
    contractVersion: entry.curveVersion,
    decisionId: `G6_${model.primary.subprofileCode}_${family}`,
  }
}

function inputForDimension(
  model: PharmaResearchWorkspaceModel,
  dimensionCode: PharmaG7DimensionCode,
): PharmaG7DimensionAdapterInput {
  const requirements = requirementsForDimension(model.primary.requirements, dimensionCode)
  const methodology = methodologyForDimension(model, dimensionCode)

  return {
    dimensionCode,
    methodologyState: methodology.state,
    readiness: {
      applicable: true,
      profileResolved: true,
      scoreReadyCoverage: evidenceCoverage(requirements),
      mandatoryBlockingConditionsSatisfied: mandatorySatisfied(requirements),
      reviewBlocked: requirements.some(
        (item) =>
          item.status === "CONFLICTING"
          || item.status === "AMBIGUOUS"
          || item.status === "REVIEW_REQUIRED",
      ),
      overlayReadiness: "NONE",
    },
    primaryScore: null,
    primaryScoreContractVersion: methodology.contractVersion,
    overlayParticipation: "NONE",
    overlayModifierPoints: null,
    overlayModifierContractVersion: null,
    methodologyLineage: [{
      decisionId: methodology.decisionId,
      contractVersion:
        methodology.contractVersion
        ?? PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION,
    }],
  }
}

export interface AuropharmaG82PreviewRow {
  readonly dimensionCode: PharmaG7DimensionCode
  readonly methodologyState: PharmaG7MethodologyState
  readonly calculationState: PharmaG7DimensionCalculationState
  readonly primaryEvidenceVerified: number
  readonly primaryEvidenceTotal: number
  readonly materialOverlay: "NONE"
  readonly emergingWatchExcluded: readonly string[]
  readonly finalScore: null
  readonly methodologyLineage: readonly {
    readonly decisionId: string
    readonly contractVersion: string
  }[]
}

export interface AuropharmaG82SameEnginePreview {
  readonly version: typeof AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION
  readonly securitySymbol: "AUROPHARMA"
  readonly threeLayerArchitecture: PharmaThreeLayerResearchArchitecture
  readonly adapterVersion: typeof PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION
  readonly primarySubprofile: "GLOBAL_GENERICS"
  readonly materialOverlays: readonly []
  readonly emergingWatches: readonly ["API_BULK_DRUGS"]
  readonly unresolvedExposures: readonly ["BIOPHARMA_BIOSIMILARS"]
  readonly overallPreviewState: "NOT_CURRENTLY_COMPUTABLE"
  readonly overallScore: null
  readonly governanceRuntimeInputResolved: false
  readonly rows: readonly AuropharmaG82PreviewRow[]
  readonly scoreExecutionEnabled: false
  readonly persistedScoreRunEnabled: false
  readonly recommendationEnabled: false
  readonly positionSizingEnabled: false
  readonly sharedStateMutationEnabled: false
}

export function buildAuropharmaG82SameEnginePreview(
  securityId: string,
  metrics: readonly ResearchMetric[],
  evaluationDate: string,
): AuropharmaG82SameEnginePreview {
  const assignment = previewAssignment(securityId)
  const model = buildPharmaResearchWorkspaceModel(assignment, metrics, evaluationDate)
  const architecture = buildPharmaThreeLayerResearchArchitecture(
    assignment,
    metrics,
    evaluationDate,
    AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.unresolvedExposures.map(
      (exposureCode) => ({
        exposureCode,
        reasonCode: "NO_REVENUE_OR_PROFIT_SHARE",
      }),
    ),
  )

  const rows = DIMENSIONS.map((dimensionCode): AuropharmaG82PreviewRow => {
    const input = inputForDimension(model, dimensionCode)
    const result = calculatePharmaG7Dimension(input)
    const requirements = requirementsForDimension(model.primary.requirements, dimensionCode)
    return {
      dimensionCode,
      methodologyState: input.methodologyState,
      calculationState: result.calculationState,
      primaryEvidenceVerified: requirements.filter((item) => item.status === "VERIFIED").length,
      primaryEvidenceTotal: requirements.length,
      materialOverlay: "NONE",
      emergingWatchExcluded: ["API_BULK_DRUGS"],
      finalScore: null,
      methodologyLineage: result.methodologyLineage,
    }
  })

  return {
    version: AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION,
    securitySymbol: "AUROPHARMA",
    threeLayerArchitecture: architecture,
    adapterVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
    primarySubprofile: "GLOBAL_GENERICS",
    materialOverlays: [],
    emergingWatches: ["API_BULK_DRUGS"],
    unresolvedExposures: ["BIOPHARMA_BIOSIMILARS"],
    overallPreviewState: "NOT_CURRENTLY_COMPUTABLE",
    overallScore: null,
    governanceRuntimeInputResolved: false,
    rows,
    scoreExecutionEnabled: false,
    persistedScoreRunEnabled: false,
    recommendationEnabled: false,
    positionSizingEnabled: false,
    sharedStateMutationEnabled: false,
  }
}
