import {
  PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION,
  type ProgramCR8PortfolioRiskResult,
} from "./r8PortfolioRiskContract"

export type ProgramCR8RiskSignal =
  | "ACCEPTABLE"
  | "MONITOR"
  | "ELEVATED"
  | "CRITICAL"
  | "MISSING"
  | "STALE"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export interface ProgramCR8PortfolioRiskEvaluationInput {
  readonly assetClass: string
  readonly portfolioContextSnapshotId: string | null
  readonly sourceScoreRunId: string | null
  readonly riskSignal: ProgramCR8RiskSignal
  readonly evidenceIds: readonly string[]
  readonly concentrationReasonCodes: readonly string[]
}

export function evaluateProgramCR8PortfolioRisk(
  input: ProgramCR8PortfolioRiskEvaluationInput,
): ProgramCR8PortfolioRiskResult {
  if (
    input.assetClass.trim().toUpperCase() !== "EQUITY"
    || input.riskSignal === "NOT_APPLICABLE"
  ) {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION,
      state: "NOT_APPLICABLE",
      applicable: false,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      sourceScoreRunId: input.sourceScoreRunId,
      evidenceIds: input.evidenceIds,
      blockers: [],
      reasonCodes: ["ASSET_NOT_APPLICABLE"],
    }
  }

  if (!input.portfolioContextSnapshotId?.trim()) {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION,
      state: "BLOCKED_PREREQUISITE",
      applicable: true,
      sourcePortfolioContextSnapshotId: null,
      sourceScoreRunId: input.sourceScoreRunId,
      evidenceIds: input.evidenceIds,
      blockers: ["PORTFOLIO_CONTEXT_SNAPSHOT_MISSING"],
      reasonCodes: ["PORTFOLIO_CONTEXT_SNAPSHOT_MISSING"],
    }
  }

  if (input.riskSignal === "MISSING" || input.riskSignal === "STALE") {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION,
      state: "INSUFFICIENT_EVIDENCE",
      applicable: true,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      sourceScoreRunId: input.sourceScoreRunId,
      evidenceIds: input.evidenceIds,
      blockers: ["CANONICAL_RISK_EVIDENCE_INSUFFICIENT"],
      reasonCodes: [
        `RISK_SIGNAL_${input.riskSignal}`,
        ...input.concentrationReasonCodes,
      ],
    }
  }

  if (input.riskSignal === "CONFLICTING" || input.riskSignal === "REVIEW_REQUIRED") {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION,
      state: "REVIEW_REQUIRED",
      applicable: true,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      sourceScoreRunId: input.sourceScoreRunId,
      evidenceIds: input.evidenceIds,
      blockers: ["CANONICAL_RISK_EVIDENCE_REQUIRES_REVIEW"],
      reasonCodes: [
        `RISK_SIGNAL_${input.riskSignal}`,
        ...input.concentrationReasonCodes,
      ],
    }
  }

  const state = input.riskSignal === "ACCEPTABLE"
    ? "RISK_ACCEPTABLE"
    : input.riskSignal === "MONITOR"
      ? "RISK_MONITOR"
      : input.riskSignal === "ELEVATED"
        ? "RISK_ELEVATED"
        : "RISK_CRITICAL_REVIEW"

  return {
    version: PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION,
    state,
    applicable: true,
    sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
    sourceScoreRunId: input.sourceScoreRunId,
    evidenceIds: input.evidenceIds,
    blockers: [],
    reasonCodes: [`RISK_SIGNAL_${input.riskSignal}`, ...input.concentrationReasonCodes],
  }
}
