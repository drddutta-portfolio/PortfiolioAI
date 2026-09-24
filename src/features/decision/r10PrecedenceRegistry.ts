import type {
  ProgramCR10AttentionState,
  ProgramCR10Severity,
} from "./r10ActionCenterContract"

export interface ProgramCR10PrecedenceRule {
  readonly state: ProgramCR10AttentionState
  readonly rank: number
  readonly severity: ProgramCR10Severity
  readonly rationale: string
}

export const PROGRAM_C_R10_PRECEDENCE_RULES = [
  { state: "NOT_APPLICABLE", rank: 1000, severity: "NONE", rationale: "Unsupported/non-applicable asset state is terminal." },
  { state: "EXIT_REVIEW", rank: 900, severity: "CRITICAL", rationale: "Thesis/permanent-loss review outranks other attention states." },
  { state: "REVIEW_REQUIRED", rank: 850, severity: "HIGH", rationale: "Conflicting authoritative inputs require explicit review." },
  { state: "BLOCKED_PREREQUISITE", rank: 800, severity: "HIGH", rationale: "Missing mandatory upstream authority fails closed." },
  { state: "EVIDENCE_REVIEW", rank: 760, severity: "HIGH", rationale: "Stale/missing/conflicting evidence transition requires review." },
  { state: "INSUFFICIENT_EVIDENCE", rank: 720, severity: "MEDIUM", rationale: "Insufficient evidence prevents a stronger conclusion." },
  { state: "RISK_REVIEW", rank: 680, severity: "HIGH", rationale: "Elevated portfolio risk requires review." },
  { state: "RECOMMENDATION_CHANGE_REVIEW", rank: 620, severity: "MEDIUM", rationale: "Meaningful recommendation-state change requires review." },
  { state: "CONCENTRATION_REVIEW", rank: 580, severity: "MEDIUM", rationale: "Owner-limit-relative concentration requires review." },
  { state: "ROLE_REVIEW", rank: 540, severity: "MEDIUM", rationale: "Owner-role and deterministic candidate-role tension requires review." },
  { state: "PORTFOLIO_FIT_REVIEW", rank: 500, severity: "MEDIUM", rationale: "Portfolio-fit tension requires review." },
  { state: "THESIS_WEAKENING", rank: 440, severity: "MEDIUM", rationale: "Meaningful thesis/core-health weakening is informational review context." },
  { state: "MONITOR", rank: 360, severity: "LOW", rationale: "Monitoring state with no higher-priority review." },
  { state: "THESIS_STRENGTHENING", rank: 260, severity: "INFO", rationale: "Meaningful strengthening is informational." },
  { state: "NO_ACTION_REQUIRED", rank: 100, severity: "NONE", rationale: "Complete inputs with no review trigger." },
] as const satisfies readonly ProgramCR10PrecedenceRule[]

const BY_STATE = new Map(
  PROGRAM_C_R10_PRECEDENCE_RULES.map((rule) => [rule.state, rule]),
)

export function programCR10Precedence(state: ProgramCR10AttentionState) {
  const rule = BY_STATE.get(state)
  if (!rule) throw new Error(`Program C R10 precedence missing for ${state}.`)
  return rule
}

export function selectProgramCR10State(
  states: readonly ProgramCR10AttentionState[],
): ProgramCR10PrecedenceRule {
  const unique = [...new Set(states)]
  if (!unique.length) return programCR10Precedence("NO_ACTION_REQUIRED")
  return unique
    .map(programCR10Precedence)
    .sort((left, right) => right.rank - left.rank)[0]!
}
