import {
  buildProgramB2ReferenceResults,
  type ProgramB2DispositionState,
  type ProgramB2ReferenceResult,
} from "../research/programBR6Execution"
import {
  executeProgramB4ReferenceRecommendation,
  type ProgramB4RecommendationExecution,
} from "../research/programBR7Execution"
import {
  K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
} from "../research/k5CurrentPortfolioRoutingSnapshot"
import type { ProgramBScoringReadinessState } from "../research/programBR6Contract"
import type { ProgramBRecommendationReadinessState } from "../research/programBR7Contract"
import {
  PROGRAM_C_R8_DECISION_CONTRACT_VERSION,
  type ProgramCR8PortfolioDecisionInput,
  type ProgramCR8R6Reference,
  type ProgramCR8R7Reference,
} from "./r8PortfolioDecisionContract"
import { buildProgramCR8PortfolioContext } from "./r8PortfolioContextBuilder"
import { evaluateProgramCR8PortfolioDecision } from "./r8PortfolioDecisionEngine"
import type { ProgramCR8OwnerContext } from "./r8PortfolioContext"

export const PROGRAM_C_R8_REFERENCE_VALIDATION_VERSION =
  "PROGRAM_C_R8_REFERENCE_VALIDATION_V1" as const

function r6State(state: ProgramB2DispositionState): ProgramBScoringReadinessState {
  if (state === "SCORED") return "READY"
  return state
}

function r7State(
  recommendation: ProgramB4RecommendationExecution,
): ProgramBRecommendationReadinessState {
  if (recommendation.state === "RECOMMENDATION_READY") return "READY"
  if (recommendation.state === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT_EVIDENCE"
  if (recommendation.state === "METHODOLOGY_NOT_AVAILABLE") return "METHODOLOGY_NOT_AVAILABLE"
  if (recommendation.state === "REVIEW_REQUIRED") return "REVIEW_REQUIRED"
  if (recommendation.state === "NOT_APPLICABLE") return "NOT_APPLICABLE"
  return "BLOCKED_PREREQUISITE"
}

function r6Reference(reference: ProgramB2ReferenceResult): ProgramCR8R6Reference {
  return {
    readinessState: r6State(reference.dispositionState),
    scoreRunId: reference.scoreLineage?.runId ?? null,
    researchProfileCode: reference.scoreLineage?.researchProfileCode ?? reference.methodologyId,
    methodologyId: reference.scoreLineage?.methodologyId ?? reference.methodologyId,
    methodologyVersion: reference.scoreLineage?.methodologyVersion ?? null,
    methodologyRole: reference.scoreLineage?.methodologyRole ?? reference.methodologyRole,
    assignmentId: reference.scoreLineage?.assignmentId ?? null,
    assignmentVersion: reference.scoreLineage?.assignmentVersion ?? null,
    classificationVersion: reference.scoreLineage?.classificationVersion ?? null,
    evidenceSnapshotId: reference.scoreLineage?.evidenceSnapshotId ?? null,
    evidenceAsOfDates: reference.scoreLineage?.evidenceAsOfDates ?? [],
    reasonCodes: reference.reasonCodes,
  }
}

function r7Reference(
  recommendation: ProgramB4RecommendationExecution,
): ProgramCR8R7Reference {
  return {
    readinessState: r7State(recommendation),
    recommendationRunId: recommendation.recommendationRunId,
    sourceScoreRunId: recommendation.sourceScoreRunId,
    finalRecommendation: recommendation.suggestedRole,
    suggestedRole: recommendation.suggestedRole,
    policyId: recommendation.policyId,
    policyVersion: recommendation.policyVersion,
    reasonCodes: recommendation.reasonCodes,
  }
}

function owner(
  role: "CORE" | "SATELLITE",
  targetWeight: string,
  minimumAllocation: string,
  maximumAllocation: string,
): ProgramCR8OwnerContext {
  return {
    portfolioRole: role,
    targetPrice: null,
    stopLossPrice: null,
    targetWeight,
    minimumAllocation,
    maximumAllocation,
    investmentHorizon: "LONG_TERM",
    freezeMonitoringPreference: null,
    ownerContextVersion: `C2_REFERENCE_OWNER::${role}::${targetWeight}::${minimumAllocation}::${maximumAllocation}`,
    ownerContextAsOf: "2026-09-24T00:00:00.000Z",
  }
}

export function buildProgramCR8ReferenceValidationAssessments() {
  const references = buildProgramB2ReferenceResults()
  const recommendations = references.map(executeProgramB4ReferenceRecommendation)
  const r6BySymbol = new Map(references.map((row) => [row.symbol, row]))
  const r7BySymbol = new Map(recommendations.map((row) => [row.symbol, row]))

  const tornt = r6BySymbol.get("TORNTPHARM")
  const alivus = r6BySymbol.get("ALIVUS")
  const torntR7 = r7BySymbol.get("TORNTPHARM")
  const alivusR7 = r7BySymbol.get("ALIVUS")
  if (!tornt?.scoreLineage || !alivus?.scoreLineage || !torntR7 || !alivusR7) {
    throw new Error("Program C C2 reference validation requires scored TORNTPHARM and ALIVUS Program B lineage.")
  }

  const torntOwner = owner("CORE", "4", "2", "5")
  const alivusOwner = owner("SATELLITE", "2", "1", "3")
  const context = buildProgramCR8PortfolioContext({
    portfolioId: "PROGRAM_C_C2_REFERENCE_PORTFOLIO",
    holdings: [
      {
        securityId: tornt.scoreLineage.securityId,
        symbol: "TORNTPHARM",
        assetClass: "EQUITY",
        quantity: "10",
        averageCost: "700",
        currentPrice: "800",
        currentValue: "8000",
        currentWeight: "4",
        sector: "Pharma",
        industry: "Pharmaceuticals",
        basicIndustry: null,
        classificationVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
        themes: [],
        ownerContext: torntOwner,
      },
      {
        securityId: alivus.scoreLineage.securityId,
        symbol: "ALIVUS",
        assetClass: "EQUITY",
        quantity: "10",
        averageCost: "100",
        currentPrice: "120",
        currentValue: "1200",
        currentWeight: "2",
        sector: "Pharma",
        industry: "Pharmaceuticals",
        basicIndustry: null,
        classificationVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
        themes: [],
        ownerContext: alivusOwner,
      },
    ],
    classificationSnapshotVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
    marketDataAsOf: "2026-09-24T00:00:00.000Z",
    r6ScoreRunIds: [tornt.scoreLineage.runId, alivus.scoreLineage.runId],
    r7RecommendationRunIds: [
      torntR7.recommendationRunId,
      alivusR7.recommendationRunId,
    ].filter((value): value is string => value !== null),
    snapshotAsOf: "2026-09-24T00:00:00.000Z",
  })

  const buildInput = (
    reference: ProgramB2ReferenceResult,
    recommendation: ProgramB4RecommendationExecution,
    ownerContext: ProgramCR8OwnerContext,
  ): ProgramCR8PortfolioDecisionInput => {
    if (!reference.scoreLineage) {
      throw new Error(`Program C C2 reference input requires score lineage for ${reference.symbol}.`)
    }
    const symbol = reference.symbol
    return {
      version: PROGRAM_C_R8_DECISION_CONTRACT_VERSION,
      securityId: reference.scoreLineage.securityId,
      assetClass: "EQUITY",
      asOfDate: "2026-09-24",
      r6: r6Reference(reference),
      r7: r7Reference(recommendation),
      ownerContext,
      portfolioContext: context,
      canonicalEvidence: [
        {
          domain: "PORTFOLIO_RISK",
          state: "FRESH",
          evidenceIds: [`C2_REFERENCE_RISK_${symbol}`],
          asOfDates: ["2026-09-24"],
          authorityVersion: "C2_REFERENCE_EVIDENCE_V1",
        },
        {
          domain: "EXIT_THESIS",
          state: "FRESH",
          evidenceIds: [`C2_REFERENCE_THESIS_${symbol}`],
          asOfDates: ["2026-09-24"],
          authorityVersion: "C2_REFERENCE_EVIDENCE_V1",
        },
      ],
    }
  }

  const torntInput = buildInput(tornt, torntR7, torntOwner)
  const torntSignals = {
    coreHealth: "HEALTHY" as const,
    portfolioRisk: "ACCEPTABLE" as const,
    exitIntelligence: "NO_SIGNAL" as const,
    riskEvidenceIds: ["C2_REFERENCE_RISK_TORNTPHARM"],
    thesisEvidenceIds: ["C2_REFERENCE_THESIS_TORNTPHARM"],
  }
  const torntAssessment = evaluateProgramCR8PortfolioDecision(
    torntInput,
    torntSignals,
  )

  const alivusInput = buildInput(alivus, alivusR7, alivusOwner)
  const alivusSignals = {
    coreHealth: "HEALTHY" as const,
    portfolioRisk: "MONITOR" as const,
    exitIntelligence: "NO_SIGNAL" as const,
    riskEvidenceIds: ["C2_REFERENCE_RISK_ALIVUS"],
    thesisEvidenceIds: ["C2_REFERENCE_THESIS_ALIVUS"],
  }
  const alivusAssessment = evaluateProgramCR8PortfolioDecision(
    alivusInput,
    alivusSignals,
  )

  return {
    version: PROGRAM_C_R8_REFERENCE_VALIDATION_VERSION,
    fixtureOnly: true as const,
    context,
    inputs: {
      tornt: { input: torntInput, signals: torntSignals },
      alivus: { input: alivusInput, signals: alivusSignals },
    },
    rows: [
      { symbol: "TORNTPHARM" as const, assessment: torntAssessment },
      { symbol: "ALIVUS" as const, assessment: alivusAssessment },
    ],
  }
}
