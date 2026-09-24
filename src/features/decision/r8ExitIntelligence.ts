import {
  PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION,
  type ProgramCR8ExitIntelligenceResult,
} from "./r8ExitIntelligenceContract"

export type ProgramCR8ExitSignal =
  | "NO_SIGNAL"
  | "MONITOR"
  | "REVIEW_REQUIRED"
  | "ELEVATED"
  | "HARD_REVIEW"
  | "MISSING"
  | "STALE"
  | "CONFLICTING"
  | "NOT_APPLICABLE"

export interface ProgramCR8ExitIntelligenceEvaluationInput {
  readonly assetClass: string
  readonly sourceScoreRunId: string | null
  readonly sourceRecommendationRunId: string | null
  readonly exitSignal: ProgramCR8ExitSignal
  readonly thesisEvidenceIds: readonly string[]
  readonly priceWeaknessObserved?: boolean
  readonly valuationConcernObserved?: boolean
  readonly overweightObserved?: boolean
}

export function evaluateProgramCR8ExitIntelligence(
  input: ProgramCR8ExitIntelligenceEvaluationInput,
): ProgramCR8ExitIntelligenceResult {
  if (
    input.assetClass.trim().toUpperCase() !== "EQUITY"
    || input.exitSignal === "NOT_APPLICABLE"
  ) {
    return {
      version: PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION,
      state: "NOT_APPLICABLE",
      applicable: false,
      sourceScoreRunId: input.sourceScoreRunId,
      sourceRecommendationRunId: input.sourceRecommendationRunId,
      thesisEvidenceIds: input.thesisEvidenceIds,
      blockers: [],
      reasonCodes: ["ASSET_NOT_APPLICABLE"],
    }
  }

  const contextualReasons = [
    input.priceWeaknessObserved ? "PRICE_WEAKNESS_CONTEXT_ONLY" : null,
    input.valuationConcernObserved ? "VALUATION_CONTEXT_ONLY" : null,
    input.overweightObserved ? "OVERWEIGHT_CONTEXT_ONLY" : null,
  ].filter((value): value is string => value !== null)

  if (input.exitSignal === "MISSING" || input.exitSignal === "STALE") {
    return {
      version: PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION,
      state: "INSUFFICIENT_EVIDENCE",
      applicable: true,
      sourceScoreRunId: input.sourceScoreRunId,
      sourceRecommendationRunId: input.sourceRecommendationRunId,
      thesisEvidenceIds: input.thesisEvidenceIds,
      blockers: ["THESIS_PERMANENT_LOSS_EVIDENCE_INSUFFICIENT"],
      reasonCodes: [`EXIT_SIGNAL_${input.exitSignal}`, ...contextualReasons],
    }
  }

  if (input.exitSignal === "CONFLICTING" || input.exitSignal === "REVIEW_REQUIRED") {
    return {
      version: PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION,
      state: "REVIEW_REQUIRED",
      applicable: true,
      sourceScoreRunId: input.sourceScoreRunId,
      sourceRecommendationRunId: input.sourceRecommendationRunId,
      thesisEvidenceIds: input.thesisEvidenceIds,
      blockers: ["THESIS_PERMANENT_LOSS_EVIDENCE_REQUIRES_REVIEW"],
      reasonCodes: [`EXIT_SIGNAL_${input.exitSignal}`, ...contextualReasons],
    }
  }

  if (!input.thesisEvidenceIds.length) {
    return {
      version: PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION,
      state: "INSUFFICIENT_EVIDENCE",
      applicable: true,
      sourceScoreRunId: input.sourceScoreRunId,
      sourceRecommendationRunId: input.sourceRecommendationRunId,
      thesisEvidenceIds: [],
      blockers: ["THESIS_PERMANENT_LOSS_EVIDENCE_ID_MISSING"],
      reasonCodes: ["THESIS_EVIDENCE_ID_MISSING", ...contextualReasons],
    }
  }

  const state = input.exitSignal === "NO_SIGNAL"
    ? "NO_EXIT_SIGNAL"
    : input.exitSignal === "MONITOR"
      ? "EXIT_MONITOR"
      : input.exitSignal === "ELEVATED"
        ? "EXIT_RISK_ELEVATED"
        : "HARD_EXIT_REVIEW"

  return {
    version: PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION,
    state,
    applicable: true,
    sourceScoreRunId: input.sourceScoreRunId,
    sourceRecommendationRunId: input.sourceRecommendationRunId,
    thesisEvidenceIds: input.thesisEvidenceIds,
    blockers: [],
    reasonCodes: [`EXIT_SIGNAL_${input.exitSignal}`, ...contextualReasons],
  }
}
