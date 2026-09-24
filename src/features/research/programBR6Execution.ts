import { ALIVUS_G10_1_READ_ONLY_SCORE_RESULT } from "./alivusG101ReadOnlyScore"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { BIOCON_G10_3_FINAL_RESULT } from "./bioconG103FinalResult"
import { K5_CURRENT_PORTFOLIO_ROUTING_ROWS, K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION } from "./k5CurrentPortfolioRoutingSnapshot"
import {
  PROGRAM_B_R6_CONTRACT_VERSION,
  resolveProgramBMethodology,
  type ProgramBScoringReadinessState,
} from "./programBR6Contract"
import { SYNGENE_G10_4_FINAL_RESULT } from "./syngeneG104FinalResult"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

export const PROGRAM_B_R6_EXECUTION_VERSION = "PROGRAM_B_R6_EXECUTION_V1" as const

export type ProgramB2DispositionState =
  | "SCORED"
  | Exclude<ProgramBScoringReadinessState, "READY">

export interface ProgramB2ReferenceResult {
  readonly symbol: string
  readonly methodologyRole: string | null
  readonly methodologyId: string | null
  readonly artifactVersion: string | null
  readonly dispositionState: ProgramB2DispositionState
  readonly overallScore: number | null
  readonly categoryScores: Readonly<Record<string, number>>
  readonly reasonCodes: readonly string[]
  readonly noRenormalization: true
  readonly readOnly: true
  readonly nonPersisting: true
}

export interface ProgramB2PortfolioDispositionRow {
  readonly symbol: string
  readonly assetClass: string
  readonly sector: string | null
  readonly industry: string | null
  readonly methodologyState: string
  readonly engineCode: string | null
  readonly routedProfileCode: string | null
  readonly methodologyId: string | null
  readonly methodologyRole: string | null
  readonly dispositionState: ProgramB2DispositionState
  readonly overallScore: number | null
  readonly reasonCodes: readonly string[]
}

export interface ProgramB2PortfolioValidation {
  readonly version: typeof PROGRAM_B_R6_EXECUTION_VERSION
  readonly sourceSnapshotVersion: typeof K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION
  readonly rows: readonly ProgramB2PortfolioDispositionRow[]
  readonly totalHoldings: number
  readonly scored: number
  readonly failClosed: number
  readonly dispositionComplete: true
  readonly numericCoverageComplete: boolean
  readonly providerCalls: 0
}

export interface ProgramBRoleScopedEvidenceIdentity {
  readonly securityId: string
  readonly methodologyRole: string
  readonly assignmentId: string
  readonly assignmentVersion: string | number
  readonly effectiveFrom: string
  readonly evidenceId: string
}

function finite(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(`Program B B2 reference score is not finite for ${label}.`)
  }
  return value
}

function dimensionScores(
  rows: readonly { readonly dimensionCode: string; readonly finalScore: number | null }[],
  symbol: string,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    rows.map((row) => [row.dimensionCode, finite(row.finalScore, `${symbol}:${row.dimensionCode}`)]),
  )
}

function scoredReferences(): readonly ProgramB2ReferenceResult[] {
  return [
    {
      symbol: "TORNTPHARM",
      methodologyRole: TORNTPHARM_GATE_H3_READ_ONLY_RESULT.primarySubprofile,
      methodologyId: "PHARMA_V1",
      artifactVersion: TORNTPHARM_GATE_H3_READ_ONLY_RESULT.contractVersion,
      dispositionState: "SCORED",
      overallScore: finite(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore, "TORNTPHARM"),
      categoryScores: dimensionScores(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.dimensions, "TORNTPHARM"),
      reasonCodes: [...TORNTPHARM_GATE_H3_READ_ONLY_RESULT.reasonCodes],
      noRenormalization: true,
      readOnly: true,
      nonPersisting: true,
    },
    {
      symbol: "ALIVUS",
      methodologyRole: ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.primarySubprofile,
      methodologyId: "PHARMA_V1",
      artifactVersion: ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.contractVersion,
      dispositionState: "SCORED",
      overallScore: finite(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.overallScore, "ALIVUS"),
      categoryScores: dimensionScores(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.dimensions, "ALIVUS"),
      reasonCodes: ["G10_1_API_READ_ONLY_SCORE_REUSED_WITHOUT_RECALCULATION"],
      noRenormalization: true,
      readOnly: true,
      nonPersisting: true,
    },
  ]
}

function failClosedReferences(): readonly ProgramB2ReferenceResult[] {
  return [
    {
      symbol: "AUROPHARMA",
      methodologyRole: AUROPHARMA_G10_2_FINAL_RESULT.primarySubprofile,
      methodologyId: "PHARMA_V1",
      artifactVersion: AUROPHARMA_G10_2_FINAL_RESULT.version,
      dispositionState: "INSUFFICIENT_EVIDENCE",
      overallScore: null,
      categoryScores: {},
      reasonCodes: AUROPHARMA_G10_2_FINAL_RESULT.blockerGroups.map((group) => group.code),
      noRenormalization: true,
      readOnly: true,
      nonPersisting: true,
    },
    {
      symbol: "BIOCON",
      methodologyRole: BIOCON_G10_3_FINAL_RESULT.primarySubprofile,
      methodologyId: "PHARMA_V1",
      artifactVersion: BIOCON_G10_3_FINAL_RESULT.methodologyVersion,
      dispositionState: "INSUFFICIENT_EVIDENCE",
      overallScore: null,
      categoryScores: {},
      reasonCodes: BIOCON_G10_3_FINAL_RESULT.blockerGroups.map((group) => group.code),
      noRenormalization: true,
      readOnly: true,
      nonPersisting: true,
    },
    {
      symbol: "SYNGENE",
      methodologyRole: SYNGENE_G10_4_FINAL_RESULT.primarySubprofile,
      methodologyId: "PHARMA_V1",
      artifactVersion: SYNGENE_G10_4_FINAL_RESULT.methodologyVersion,
      dispositionState: "INSUFFICIENT_EVIDENCE",
      overallScore: null,
      categoryScores: {},
      reasonCodes: SYNGENE_G10_4_FINAL_RESULT.blockerGroups.map((group) => group.code),
      noRenormalization: true,
      readOnly: true,
      nonPersisting: true,
    },
    {
      symbol: "HDFCBANK",
      methodologyRole: "BANK",
      methodologyId: "BANK_NBFC_STAGE_8_BANK_V1",
      artifactVersion: null,
      dispositionState: "BLOCKED_PREREQUISITE",
      overallScore: null,
      categoryScores: {},
      reasonCodes: ["B2_CACHE_PURE_BANK_REFERENCE_INPUT_SNAPSHOT_NOT_MATERIALIZED"],
      noRenormalization: true,
      readOnly: true,
      nonPersisting: true,
    },
  ]
}

export function buildProgramB2ReferenceResults(): readonly ProgramB2ReferenceResult[] {
  return [...scoredReferences(), ...failClosedReferences()]
}

function referenceForSymbol(symbol: string): ProgramB2ReferenceResult | null {
  return buildProgramB2ReferenceResults().find((row) => row.symbol === symbol) ?? null
}

function methodologyRoleForPortfolioRow(
  routedProfileCode: string | null,
  reference: ProgramB2ReferenceResult | null,
): string | null {
  if (reference?.methodologyRole) return reference.methodologyRole
  return routedProfileCode
}

function failClosedStateFromMethodology(
  state: "METHODOLOGY_NOT_AVAILABLE" | "REVIEW_REQUIRED" | "NOT_APPLICABLE",
): ProgramB2DispositionState {
  return state
}

export function buildProgramB2FrozenPortfolioDisposition(): ProgramB2PortfolioValidation {
  const rows = K5_CURRENT_PORTFOLIO_ROUTING_ROWS.map((holding): ProgramB2PortfolioDispositionRow => {
    const methodology = resolveProgramBMethodology({
      assetClass: holding.assetClass,
      sector: holding.sector,
      industry: holding.industry,
      basicIndustry: null,
      classificationVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
      classificationState: "READY",
    })

    const reference = referenceForSymbol(holding.symbol)
    if (methodology.state !== "RESOLVED") {
      return {
        symbol: holding.symbol,
        assetClass: holding.assetClass,
        sector: holding.sector,
        industry: holding.industry,
        methodologyState: methodology.state,
        engineCode: methodology.engineCode,
        routedProfileCode: methodology.routedProfileCode,
        methodologyId: methodology.methodologyAuthority,
        methodologyRole: methodologyRoleForPortfolioRow(methodology.routedProfileCode, reference),
        dispositionState: failClosedStateFromMethodology(methodology.state),
        overallScore: null,
        reasonCodes: [methodology.reasonCode],
      }
    }

    if (reference) {
      return {
        symbol: holding.symbol,
        assetClass: holding.assetClass,
        sector: holding.sector,
        industry: holding.industry,
        methodologyState: methodology.state,
        engineCode: methodology.engineCode,
        routedProfileCode: methodology.routedProfileCode,
        methodologyId: methodology.methodologyAuthority,
        methodologyRole: methodologyRoleForPortfolioRow(methodology.routedProfileCode, reference),
        dispositionState: reference.dispositionState,
        overallScore: reference.overallScore,
        reasonCodes: reference.reasonCodes,
      }
    }

    return {
      symbol: holding.symbol,
      assetClass: holding.assetClass,
      sector: holding.sector,
      industry: holding.industry,
      methodologyState: methodology.state,
      engineCode: methodology.engineCode,
      routedProfileCode: methodology.routedProfileCode,
      methodologyId: methodology.methodologyAuthority,
      methodologyRole: methodology.routedProfileCode,
      dispositionState: "BLOCKED_PREREQUISITE",
      overallScore: null,
      reasonCodes: ["CANONICAL_B2_SCORE_INPUT_SNAPSHOT_NOT_MATERIALIZED"],
    }
  })

  const scored = rows.filter((row) => row.dispositionState === "SCORED").length
  return {
    version: PROGRAM_B_R6_EXECUTION_VERSION,
    sourceSnapshotVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
    rows,
    totalHoldings: rows.length,
    scored,
    failClosed: rows.length - scored,
    dispositionComplete: true,
    numericCoverageComplete: scored === rows.length,
    providerCalls: 0,
  }
}

export function programBRoleScopedEvidenceKey(
  input: ProgramBRoleScopedEvidenceIdentity,
): string {
  const values = [
    input.securityId,
    input.methodologyRole,
    input.assignmentId,
    String(input.assignmentVersion),
    input.effectiveFrom,
    input.evidenceId,
  ].map((value) => value.trim())

  if (values.some((value) => !value)) {
    throw new Error("Program B role-scoped evidence identity requires complete company, role, assignment, effective-date and evidence lineage.")
  }
  return values.join("::")
}

export function canonicalProgramB2ReferencePayload(
  row: ProgramB2ReferenceResult,
) {
  return {
    contractVersion: PROGRAM_B_R6_CONTRACT_VERSION,
    executionVersion: PROGRAM_B_R6_EXECUTION_VERSION,
    symbol: row.symbol,
    methodologyRole: row.methodologyRole,
    methodologyId: row.methodologyId,
    artifactVersion: row.artifactVersion,
    dispositionState: row.dispositionState,
    overallScore: row.overallScore,
    categoryScores: Object.fromEntries(
      Object.entries(row.categoryScores).sort(([left], [right]) => left.localeCompare(right)),
    ),
    reasonCodes: [...row.reasonCodes].sort(),
    noRenormalization: row.noRenormalization,
  }
}

export function buildProgramB2ControlledCohort() {
  const references = buildProgramB2ReferenceResults()
  const unsupported = K5_CURRENT_PORTFOLIO_ROUTING_ROWS.find((holding) => {
    const methodology = resolveProgramBMethodology({
      assetClass: holding.assetClass,
      sector: holding.sector,
      industry: holding.industry,
      basicIndustry: null,
      classificationVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
      classificationState: "READY",
    })
    return methodology.state === "METHODOLOGY_NOT_AVAILABLE"
  })

  const unsupportedControl = unsupported
    ? (() => {
        const methodology = resolveProgramBMethodology({
          assetClass: unsupported.assetClass,
          sector: unsupported.sector,
          industry: unsupported.industry,
          basicIndustry: null,
          classificationVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
          classificationState: "READY",
        })
        return {
          symbol: unsupported.symbol,
          controlType: "CURRENT_PORTFOLIO_UNSUPPORTED_METHODOLOGY" as const,
          dispositionState: methodology.state,
          reasonCode: methodology.reasonCode,
        }
      })()
    : null

  const nonEquityMethodology = resolveProgramBMethodology({
    assetClass: "ETF",
    sector: null,
    industry: null,
    basicIndustry: null,
    classificationVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
    classificationState: "READY",
  })

  return {
    version: PROGRAM_B_R6_EXECUTION_VERSION,
    references,
    unsupportedControl,
    nonEquityControl: {
      symbol: "NON_EQUITY_CONTRACT_CONTROL",
      controlType: "SYNTHETIC_APPLICABILITY_CONTROL" as const,
      dispositionState: nonEquityMethodology.state,
      reasonCode: nonEquityMethodology.reasonCode,
    },
    providerCalls: 0 as const,
  }
}

export const PROGRAM_B_B2_SAFETY_BOUNDARY = {
  providerCalls: 0,
  angelOneCalls: 0,
  trendlyneCalls: 0,
  openAiDecisionCalls: 0,
  scorePersistence: false,
  recommendationComputation: false,
  recommendationPersistence: false,
  positionSizing: false,
  productionMutation: false,
  migration: false,
  deployment: false,
  merge: false,
  schedulerMutation: false,
  trading: false,
} as const
