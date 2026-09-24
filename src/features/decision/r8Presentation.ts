import type {
  ProgramCR8PortfolioDecisionAssessment,
} from "./r8PortfolioDecisionContract"

export type ProgramCR8PresentationTone =
  | "positive"
  | "warning"
  | "negative"
  | "neutral"

export type ProgramCR8CoverageState =
  | "EVALUATED"
  | "INSUFFICIENT"
  | "BLOCKED"
  | "REVIEW"
  | "NOT_APPLICABLE"

export interface ProgramCR8PresentedState {
  readonly state: string
  readonly label: string
  readonly tone: ProgramCR8PresentationTone
  readonly coverage: ProgramCR8CoverageState
}

export interface ProgramCR8PresentationRow {
  readonly securityId: string
  readonly decisionRunId: string
  readonly overallDisposition: ProgramCR8PresentedState
  readonly coreHealth: ProgramCR8PresentedState
  readonly portfolioFit: ProgramCR8PresentedState
  readonly portfolioRisk: ProgramCR8PresentedState
  readonly exitIntelligence: ProgramCR8PresentedState
  readonly blockerCount: number
  readonly reasonCodes: readonly string[]
}

function label(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function coverage(state: string): ProgramCR8CoverageState {
  if (state === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT"
  if (state === "BLOCKED_PREREQUISITE") return "BLOCKED"
  if (state === "REVIEW_REQUIRED") return "REVIEW"
  if (state === "NOT_APPLICABLE") return "NOT_APPLICABLE"
  return "EVALUATED"
}

function tone(state: string): ProgramCR8PresentationTone {
  if (
    state.includes("AT_RISK")
    || state.includes("CRITICAL")
    || state.includes("HARD_EXIT")
  ) return "negative"
  if (
    state.includes("WATCH")
    || state.includes("MONITOR")
    || state.includes("ELEVATED")
    || state.includes("TENSION")
    || state.includes("REVIEW")
    || state === "INSUFFICIENT_EVIDENCE"
    || state === "BLOCKED_PREREQUISITE"
  ) return "warning"
  if (
    state.includes("HEALTHY")
    || state.includes("SUPPORTED")
    || state.includes("ACCEPTABLE")
    || state === "NO_EXIT_SIGNAL"
    || state === "ASSESSMENT_COMPLETE"
  ) return "positive"
  return "neutral"
}

function present(state: string): ProgramCR8PresentedState {
  return {
    state,
    label: label(state),
    tone: tone(state),
    coverage: coverage(state),
  }
}

export function projectProgramCR8Assessment(
  assessment: ProgramCR8PortfolioDecisionAssessment,
): ProgramCR8PresentationRow {
  return {
    securityId: assessment.securityId,
    decisionRunId: assessment.decisionRunId,
    overallDisposition: present(assessment.overallDisposition),
    coreHealth: present(assessment.coreHealth.state),
    portfolioFit: present(assessment.portfolioFit.state),
    portfolioRisk: present(assessment.portfolioRisk.state),
    exitIntelligence: present(assessment.exitIntelligence.state),
    blockerCount: assessment.blockers.length,
    reasonCodes: assessment.reasonCodes,
  }
}
