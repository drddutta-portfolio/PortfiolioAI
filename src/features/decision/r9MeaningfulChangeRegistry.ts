import {
  PROGRAM_C_R9_RULE_REGISTRY_VERSION,
  type ProgramCR9ChangeDomain,
  type ProgramCR9MaterialityClass,
} from "./r9MeaningfulChangeContract"

export interface ProgramCR9MeaningfulChangeRule {
  readonly registryVersion: typeof PROGRAM_C_R9_RULE_REGISTRY_VERSION
  readonly code: string
  readonly domain: ProgramCR9ChangeDomain
  readonly materiality: ProgramCR9MaterialityClass
  readonly comparison: "CATEGORICAL" | "IDENTITY" | "SET" | "EXACT_NUMERIC"
  readonly approvedThreshold: null
  readonly rationale: string
}

function rule(
  code: string,
  domain: ProgramCR9ChangeDomain,
  materiality: ProgramCR9MaterialityClass,
  comparison: ProgramCR9MeaningfulChangeRule["comparison"],
  rationale: string,
): ProgramCR9MeaningfulChangeRule {
  return {
    registryVersion: PROGRAM_C_R9_RULE_REGISTRY_VERSION,
    code,
    domain,
    materiality,
    comparison,
    approvedThreshold: null,
    rationale,
  }
}

export const PROGRAM_C_R9_MEANINGFUL_CHANGE_RULES = [
  rule("R6_READINESS_CHANGED", "R6", "MEANINGFUL", "CATEGORICAL", "Scoring readiness changed."),
  rule("R7_READINESS_CHANGED", "R7", "MEANINGFUL", "CATEGORICAL", "Recommendation readiness changed."),
  rule("R7_RECOMMENDATION_CHANGED", "R7", "MEANINGFUL", "CATEGORICAL", "Recommendation candidate state changed."),
  rule("METHODOLOGY_ID_CHANGED", "METHODOLOGY", "MEANINGFUL", "IDENTITY", "Methodology authority changed."),
  rule("METHODOLOGY_VERSION_CHANGED", "METHODOLOGY", "MEANINGFUL", "IDENTITY", "Methodology version changed."),
  rule("METHODOLOGY_ROLE_CHANGED", "METHODOLOGY", "MEANINGFUL", "IDENTITY", "Methodology role changed."),
  rule("ASSIGNMENT_ID_CHANGED", "ASSIGNMENT", "MEANINGFUL", "IDENTITY", "Assignment identity changed."),
  rule("ASSIGNMENT_VERSION_CHANGED", "ASSIGNMENT", "MEANINGFUL", "IDENTITY", "Assignment version changed."),
  rule("CLASSIFICATION_VERSION_CHANGED", "CLASSIFICATION", "MEANINGFUL", "IDENTITY", "Classification authority version changed."),
  rule("EVIDENCE_STATE_CHANGED", "EVIDENCE", "MEANINGFUL", "CATEGORICAL", "Evidence readiness/freshness state changed."),
  rule("VALUATION_STATE_CHANGED", "VALUATION", "MEANINGFUL", "CATEGORICAL", "Canonical valuation category changed."),
  rule("MOMENTUM_STATE_CHANGED", "MOMENTUM", "MEANINGFUL", "CATEGORICAL", "Canonical momentum category changed."),
  rule("R8_OVERALL_CHANGED", "R8", "MEANINGFUL", "CATEGORICAL", "R8 overall disposition changed."),
  rule("CORE_HEALTH_CHANGED", "CORE_HEALTH", "MEANINGFUL", "CATEGORICAL", "Core Health state changed."),
  rule("PORTFOLIO_FIT_CHANGED", "PORTFOLIO_FIT", "MEANINGFUL", "CATEGORICAL", "Portfolio Fit state changed."),
  rule("PORTFOLIO_RISK_CHANGED", "PORTFOLIO_RISK", "MEANINGFUL", "CATEGORICAL", "Portfolio Risk state changed."),
  rule("EXIT_INTELLIGENCE_CHANGED", "EXIT_INTELLIGENCE", "MEANINGFUL", "CATEGORICAL", "Exit Intelligence state changed."),
  rule("R8_BLOCKER_SET_CHANGED", "BLOCKERS", "MEANINGFUL", "SET", "A blocker appeared, cleared or changed."),
  rule("OWNER_CONTEXT_VERSION_CHANGED", "OWNER_CONTEXT", "MEANINGFUL", "IDENTITY", "Owner-authored context version changed."),
  rule("R6_SCORE_RUN_CHANGED", "R6", "RAW_IMMATERIAL", "IDENTITY", "A new score run alone has no approved materiality rule."),
  rule("R7_RECOMMENDATION_RUN_CHANGED", "R7", "RAW_IMMATERIAL", "IDENTITY", "A new recommendation run alone has no approved materiality rule."),
  rule("R8_DECISION_RUN_CHANGED", "R8", "RAW_IMMATERIAL", "IDENTITY", "A new R8 run alone has no approved materiality rule."),
  rule("EVIDENCE_SNAPSHOT_CHANGED", "EVIDENCE", "RAW_IMMATERIAL", "IDENTITY", "Evidence refresh alone is not material when categorical state is unchanged."),
  rule("PORTFOLIO_CONTEXT_SNAPSHOT_CHANGED", "PORTFOLIO_CONTEXT", "RAW_IMMATERIAL", "IDENTITY", "Context snapshot identity alone is not material when R8 states are unchanged."),
  rule("R6_SCORE_VALUE_CHANGED_WITHOUT_THRESHOLD", "R6", "RAW_IMMATERIAL", "EXACT_NUMERIC", "No numeric score-delta threshold is approved in Program C."),
] as const satisfies readonly ProgramCR9MeaningfulChangeRule[]

const RULE_BY_CODE = new Map(
  PROGRAM_C_R9_MEANINGFUL_CHANGE_RULES.map((entry) => [entry.code, entry]),
)

export function programCR9Rule(code: string): ProgramCR9MeaningfulChangeRule {
  const entry = RULE_BY_CODE.get(code)
  if (!entry) throw new Error(`Program C R9 rule not registered: ${code}`)
  return entry
}

export const PROGRAM_C_R9_NUMERIC_THRESHOLD_AUTHORITY = {
  scoreDeltaThreshold: null,
  valuationDeltaThreshold: null,
  momentumDeltaThreshold: null,
  concentrationDeltaThreshold: null,
  hysteresisThreshold: null,
  persistenceDurationRule: null,
  policy: "NO_NUMERIC_OR_DURATION_THRESHOLD_APPROVED",
} as const
