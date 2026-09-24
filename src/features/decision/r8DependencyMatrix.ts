export const PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION =
  "PROGRAM_C_R8_DEPENDENCY_MATRIX_V1" as const

export type ProgramCR8SubEngineCode =
  | "CORE_HEALTH"
  | "PORTFOLIO_FIT"
  | "PORTFOLIO_RISK"
  | "EXIT_INTELLIGENCE"

export type ProgramCR8R7Requirement =
  | "NOT_REQUIRED"
  | "OPTIONAL_CONTEXT"

export interface ProgramCR8DependencyMatrixEntry {
  readonly version: typeof PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION
  readonly subEngine: ProgramCR8SubEngineCode
  readonly mandatoryUpstreamStates: readonly string[]
  readonly optionalUpstreamStates: readonly string[]
  readonly portfolioContextRequirements: readonly string[]
  readonly marketRiskEvidenceRequirements: readonly string[]
  readonly ownerContextRequirements: readonly string[]
  readonly applicabilityRules: readonly string[]
  readonly blockingConditions: readonly string[]
  readonly r7Requirement: ProgramCR8R7Requirement
  readonly prohibitedFallbacks: readonly string[]
}

export const PROGRAM_C_R8_DEPENDENCY_MATRIX:
  readonly ProgramCR8DependencyMatrixEntry[] = [
    {
      version: PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
      subEngine: "CORE_HEALTH",
      mandatoryUpstreamStates: [
        "SECURITY_IDENTITY",
        "OWNER_ROLE",
        "R6_FACTS_REQUIRED_BY_APPLICABLE_APPROVED_CORE_HEALTH_RULES",
      ],
      optionalUpstreamStates: [
        "R7_RECOMMENDATION_CONTEXT",
      ],
      portfolioContextRequirements: [
        "PORTFOLIO_ID",
        "PORTFOLIO_CONTEXT_SNAPSHOT_ID",
      ],
      marketRiskEvidenceRequirements: [
        "ONLY_WHERE_AN_APPROVED_CORE_HEALTH_RULE_EXPLICITLY_REQUIRES_IT",
      ],
      ownerContextRequirements: [
        "OWNER_PORTFOLIO_ROLE",
      ],
      applicabilityRules: [
        "FORMAL_CORE_HEALTH_APPLIES_ONLY_TO_OWNER_ROLE_CORE",
        "NON_CORE_RETURNS_NOT_APPLICABLE",
      ],
      blockingConditions: [
        "MISSING_SECURITY_IDENTITY",
        "MISSING_OWNER_ROLE",
        "MISSING_MANDATORY_R6_FACT_FOR_APPLICABLE_RULE",
        "STALE_OR_CONFLICTING_MANDATORY_FACT",
      ],
      r7Requirement: "OPTIONAL_CONTEXT",
      prohibitedFallbacks: [
        "R6_RECOMPUTATION",
        "R7_RECOMPUTATION",
        "OWNER_ROLE_AUTO_CHANGE",
        "CROSS_SECTOR_RULE_BORROWING",
      ],
    },
    {
      version: PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
      subEngine: "PORTFOLIO_FIT",
      mandatoryUpstreamStates: [
        "SECURITY_IDENTITY",
        "CURRENT_HOLDING",
        "CURRENT_WEIGHT",
        "PORTFOLIO_CONTEXT_SNAPSHOT",
        "OWNER_ROLE_CONTEXT",
      ],
      optionalUpstreamStates: [
        "R7_RECOMMENDATION_CONTEXT",
        "OWNER_CONFIGURED_ALLOCATION_LIMITS",
        "CANONICAL_CORRELATION_OR_OVERLAP_EVIDENCE",
      ],
      portfolioContextRequirements: [
        "PORTFOLIO_ID",
        "PORTFOLIO_CONTEXT_SNAPSHOT_ID",
        "CURRENT_WEIGHT",
        "SECTOR_INDUSTRY_THEME_EXPOSURE_WHERE_AVAILABLE",
      ],
      marketRiskEvidenceRequirements: [
        "NONE_UNLESS_A_SPECIFIC_APPROVED_FIT_RULE_REQUIRES_IT",
      ],
      ownerContextRequirements: [
        "OWNER_PORTFOLIO_ROLE",
        "OWNER_LIMITS_ONLY_FOR_LIMIT_RELATIVE_RULES",
      ],
      applicabilityRules: [
        "SUPPORTED_HELD_ASSET_REQUIRED",
        "CORRELATION_LOGIC_DISABLED_WITHOUT_CANONICAL_CORRELATION_EVIDENCE",
      ],
      blockingConditions: [
        "MISSING_CURRENT_HOLDING",
        "MISSING_CURRENT_WEIGHT",
        "MISSING_PORTFOLIO_CONTEXT_SNAPSHOT",
        "MISSING_OWNER_ROLE_CONTEXT",
      ],
      r7Requirement: "NOT_REQUIRED",
      prohibitedFallbacks: [
        "INVENTED_TARGET_WEIGHT",
        "INVENTED_ALLOCATION_RANGE",
        "INVENTED_CORRELATION",
        "INVENTED_DIVERSIFICATION_THRESHOLD",
        "NEAREST_PROFILE_SIZING_FALLBACK",
      ],
    },
    {
      version: PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
      subEngine: "PORTFOLIO_RISK",
      mandatoryUpstreamStates: [
        "SECURITY_IDENTITY",
        "PORTFOLIO_CONTEXT_SNAPSHOT",
        "CANONICAL_RISK_EVIDENCE_REQUIRED_BY_APPLICABLE_APPROVED_RULES",
      ],
      optionalUpstreamStates: [
        "R6_RISK_DIMENSIONS",
        "STORED_VOLATILITY",
        "STORED_DRAWDOWN",
        "CANONICAL_LIQUIDITY",
        "R7_RECOMMENDATION_CONTEXT",
      ],
      portfolioContextRequirements: [
        "PORTFOLIO_ID",
        "PORTFOLIO_CONTEXT_SNAPSHOT_ID",
        "CURRENT_CONCENTRATION",
        "SECTOR_THEME_EXPOSURE_WHERE_AVAILABLE",
      ],
      marketRiskEvidenceRequirements: [
        "POSITIVE_ACCEPTABLE_STATE_REQUIRES_SUFFICIENT_CANONICAL_RISK_EVIDENCE",
        "MISSING_RISK_EVIDENCE_NEVER_MEANS_RISK_ACCEPTABLE",
      ],
      ownerContextRequirements: [
        "OWNER_LIMITS_ONLY_WHERE_AN_APPROVED_RULE_USES_THEM",
      ],
      applicabilityRules: [
        "SUPPORTED_HELD_ASSET_REQUIRED",
      ],
      blockingConditions: [
        "MISSING_PORTFOLIO_CONTEXT_SNAPSHOT",
        "MISSING_MANDATORY_RISK_EVIDENCE",
        "STALE_OR_CONFLICTING_MANDATORY_RISK_EVIDENCE",
      ],
      r7Requirement: "NOT_REQUIRED",
      prohibitedFallbacks: [
        "MISSING_RISK_EVIDENCE_AS_LOW_RISK",
        "INVENTED_RISK_THRESHOLD",
        "CROSS_SECTOR_RISK_RULE_BORROWING",
      ],
    },
    {
      version: PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
      subEngine: "EXIT_INTELLIGENCE",
      mandatoryUpstreamStates: [
        "SECURITY_IDENTITY",
        "APPROVED_THESIS_OR_PERMANENT_LOSS_EVIDENCE_REQUIRED_BY_APPLICABLE_RULES",
      ],
      optionalUpstreamStates: [
        "R6_RISK_AND_QUALITY_CONTEXT",
        "R7_RECOMMENDATION_CONTEXT",
        "OWNER_STOP_LOSS_CONTEXT",
        "VALUATION_CONTEXT",
        "PRICE_MOMENTUM_CONTEXT",
      ],
      portfolioContextRequirements: [
        "PORTFOLIO_ID",
        "PORTFOLIO_CONTEXT_SNAPSHOT_ID",
      ],
      marketRiskEvidenceRequirements: [
        "THESIS_OR_PERMANENT_LOSS_DETERIORATION_AUTHORITY_REQUIRED_FOR_EXIT_SIGNAL",
      ],
      ownerContextRequirements: [
        "OWNER_STOP_LOSS_MAY_BE_CONTEXT_BUT_IS_NOT_TRADE_AUTHORITY",
      ],
      applicabilityRules: [
        "SUPPORTED_HELD_ASSET_REQUIRED",
      ],
      blockingConditions: [
        "MISSING_REQUIRED_THESIS_EVIDENCE",
        "STALE_OR_CONFLICTING_REQUIRED_THESIS_EVIDENCE",
      ],
      r7Requirement: "OPTIONAL_CONTEXT",
      prohibitedFallbacks: [
        "PRICE_WEAKNESS_ALONE_AS_EXIT",
        "VALUATION_ALONE_AS_EXIT",
        "OVERWEIGHT_ALONE_AS_EXIT",
        "TRADE_INSTRUCTION",
      ],
    },
  ] as const

export function programCR8DependencyFor(
  subEngine: ProgramCR8SubEngineCode,
): ProgramCR8DependencyMatrixEntry {
  const entry = PROGRAM_C_R8_DEPENDENCY_MATRIX.find(
    (candidate) => candidate.subEngine === subEngine,
  )
  if (!entry) throw new Error(`Program C R8 dependency contract missing for ${subEngine}.`)
  return entry
}
