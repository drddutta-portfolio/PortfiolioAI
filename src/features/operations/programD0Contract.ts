import {
  PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
  type ProgramCR8SubEngineCode,
} from "../decision/r8DependencyMatrix"

export const PROGRAM_D_D0_CONTRACT_VERSION = "PROGRAM_D_D0_CONTRACT_V1" as const

export const PROGRAM_D_D0_AUTHORITY = {
  checkpoint: "D0",
  authorized: true,
  nextCheckpointAuthorized: false,
  programCMutationAllowed: false,
  providerCallsAllowed: false,
  aiCallsAllowed: false,
  migrationCreationAllowed: false,
  migrationApplicationAllowed: false,
  schedulerActivationAllowed: false,
  productionMutationAllowed: false,
  deploymentAllowed: false,
  mergeAllowed: false,
  tradingAllowed: false,
} as const

export type ProgramDR11TriggerType =
  | "SCHEDULED_MAINTENANCE"
  | "CONDITION_STALENESS"
  | "CANONICAL_EVIDENCE_ACCEPTED"
  | "MARKET_DATA_ACCEPTED"
  | "OWNER_CONTEXT_CHANGED"
  | "METHODOLOGY_CHANGED"
  | "ASSIGNMENT_CHANGED"
  | "POLICY_CHANGED"
  | "MANUAL_REPLAY"
  | "BOUNDED_PILOT"

export interface ProgramDR11TriggerContract {
  readonly type: ProgramDR11TriggerType
  readonly mayPlanProviderAcquisition: boolean
  readonly ownerConfirmationRequiredForRealProviderExecution: boolean
  readonly mayPlanDeterministicRecompute: boolean
  readonly notes: readonly string[]
}

export const PROGRAM_D_R11_TRIGGER_TAXONOMY:
  readonly ProgramDR11TriggerContract[] = [
    {
      type: "SCHEDULED_MAINTENANCE",
      mayPlanProviderAcquisition: true,
      ownerConfirmationRequiredForRealProviderExecution: true,
      mayPlanDeterministicRecompute: true,
      notes: ["STALE_DOMAIN_ONLY", "NO_BLANKET_FULL_PORTFOLIO_RECOMPUTE"],
    },
    {
      type: "CONDITION_STALENESS",
      mayPlanProviderAcquisition: true,
      ownerConfirmationRequiredForRealProviderExecution: true,
      mayPlanDeterministicRecompute: true,
      notes: ["ELIGIBILITY_AND_DOMAIN_POLICY_REQUIRED"],
    },
    {
      type: "CANONICAL_EVIDENCE_ACCEPTED",
      mayPlanProviderAcquisition: false,
      ownerConfirmationRequiredForRealProviderExecution: false,
      mayPlanDeterministicRecompute: true,
      notes: ["DOWNSTREAM_DEPENDENCY_HASH_CHANGE_ONLY"],
    },
    {
      type: "MARKET_DATA_ACCEPTED",
      mayPlanProviderAcquisition: false,
      ownerConfirmationRequiredForRealProviderExecution: false,
      mayPlanDeterministicRecompute: true,
      notes: ["MARKET_DEPENDENT_NODES_ONLY"],
    },
    {
      type: "OWNER_CONTEXT_CHANGED",
      mayPlanProviderAcquisition: false,
      ownerConfirmationRequiredForRealProviderExecution: false,
      mayPlanDeterministicRecompute: true,
      notes: ["OWNER_FIELDS_ARE_INPUT_ONLY", "R11_CANNOT_MUTATE_OWNER_CONTEXT"],
    },
    {
      type: "METHODOLOGY_CHANGED",
      mayPlanProviderAcquisition: false,
      ownerConfirmationRequiredForRealProviderExecution: false,
      mayPlanDeterministicRecompute: true,
      notes: ["VERSION_CHANGE_REQUIRED"],
    },
    {
      type: "ASSIGNMENT_CHANGED",
      mayPlanProviderAcquisition: false,
      ownerConfirmationRequiredForRealProviderExecution: false,
      mayPlanDeterministicRecompute: true,
      notes: ["REVIEWED_ASSIGNMENT_VERSION_CHANGE_REQUIRED"],
    },
    {
      type: "POLICY_CHANGED",
      mayPlanProviderAcquisition: false,
      ownerConfirmationRequiredForRealProviderExecution: false,
      mayPlanDeterministicRecompute: true,
      notes: ["VERSION_CHANGE_REQUIRED"],
    },
    {
      type: "MANUAL_REPLAY",
      mayPlanProviderAcquisition: true,
      ownerConfirmationRequiredForRealProviderExecution: true,
      mayPlanDeterministicRecompute: true,
      notes: ["LINK_TO_PRIOR_RUN", "RECHECK_ALL_EXECUTION_GATES"],
    },
    {
      type: "BOUNDED_PILOT",
      mayPlanProviderAcquisition: true,
      ownerConfirmationRequiredForRealProviderExecution: true,
      mayPlanDeterministicRecompute: true,
      notes: ["D2_SEPARATE_OWNER_AUTHORIZATION_REQUIRED"],
    },
  ] as const

export type ProgramDR11Node =
  | "R6"
  | "R7"
  | "R8_CORE_HEALTH"
  | "R8_PORTFOLIO_FIT"
  | "R8_PORTFOLIO_RISK"
  | "R8_EXIT_INTELLIGENCE"
  | "R9"
  | "R10"

export interface ProgramDR11DependencyEntry {
  readonly node: ProgramDR11Node
  readonly canonicalDependencies: readonly string[]
  readonly dependsOnNodes: readonly ProgramDR11Node[]
  readonly noOpWhenDependencyFingerprintUnchanged: true
  readonly inheritedContractVersion?: string
}

const r8 = (
  node: ProgramDR11Node,
  subEngine: ProgramCR8SubEngineCode,
  dependencies: readonly string[],
  dependsOnNodes: readonly ProgramDR11Node[],
): ProgramDR11DependencyEntry => ({
  node,
  canonicalDependencies: dependencies,
  dependsOnNodes,
  noOpWhenDependencyFingerprintUnchanged: true,
  inheritedContractVersion: `${PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION}:${subEngine}`,
})

export const PROGRAM_D_R11_DEPENDENCY_MATRIX:
  readonly ProgramDR11DependencyEntry[] = [
    {
      node: "R6",
      canonicalDependencies: [
        "SECURITY_IDENTITY",
        "CLASSIFICATION_VERSION",
        "RESEARCH_PROFILE_OR_METHOD_ASSIGNMENT",
        "ASSIGNMENT_VERSION",
        "METHODOLOGY_ID_VERSION",
        "REQUIRED_ACCEPTED_EVIDENCE_IDS_AND_AS_OF_DATES",
        "REQUIRED_EVIDENCE_FRESHNESS",
        "MARKET_HISTORY_WHERE_METHOD_REQUIRES_IT",
      ],
      dependsOnNodes: [],
      noOpWhenDependencyFingerprintUnchanged: true,
    },
    {
      node: "R7",
      canonicalDependencies: [
        "VALID_R6_RESULT_AND_LINEAGE",
        "R7_POLICY_ID_VERSION",
        "RESEARCH_PROFILE_CODE",
        "METHODOLOGY_ROLE",
        "ASSIGNMENT_VERSION",
        "MANDATORY_FLOOR_INPUT_STATE",
        "CAUTION_RISK_INPUT_STATE",
      ],
      dependsOnNodes: ["R6"],
      noOpWhenDependencyFingerprintUnchanged: true,
    },
    r8(
      "R8_CORE_HEALTH",
      "CORE_HEALTH",
      [
        "SECURITY_IDENTITY",
        "OWNER_ROLE",
        "R6_FACTS_REQUIRED_BY_APPLICABLE_APPROVED_CORE_HEALTH_RULES",
        "PORTFOLIO_CONTEXT_SNAPSHOT_ID",
        "OPTIONAL_R7_CONTEXT_ONLY_WHERE_USED",
      ],
      ["R6"],
    ),
    r8(
      "R8_PORTFOLIO_FIT",
      "PORTFOLIO_FIT",
      [
        "SECURITY_IDENTITY",
        "CURRENT_HOLDING",
        "CURRENT_WEIGHT",
        "PORTFOLIO_CONTEXT_SNAPSHOT_ID",
        "OWNER_ROLE_CONTEXT",
        "OWNER_LIMITS_ONLY_FOR_LIMIT_RELATIVE_RULES",
        "CANONICAL_CORRELATION_OR_OVERLAP_EVIDENCE_WHERE_AVAILABLE",
      ],
      [],
    ),
    r8(
      "R8_PORTFOLIO_RISK",
      "PORTFOLIO_RISK",
      [
        "SECURITY_IDENTITY",
        "PORTFOLIO_CONTEXT_SNAPSHOT_ID",
        "CANONICAL_RISK_EVIDENCE_REQUIRED_BY_APPLICABLE_APPROVED_RULES",
        "R6_RISK_DIMENSIONS_WHERE_USED",
        "STORED_VOLATILITY_DRAWDOWN_LIQUIDITY_WHERE_USED",
      ],
      [],
    ),
    r8(
      "R8_EXIT_INTELLIGENCE",
      "EXIT_INTELLIGENCE",
      [
        "SECURITY_IDENTITY",
        "APPROVED_THESIS_OR_PERMANENT_LOSS_EVIDENCE",
        "OWNER_STOP_LOSS_CONTEXT_WHERE_USED",
        "VALUATION_CONTEXT_WHERE_USED",
        "PRICE_MOMENTUM_CONTEXT_WHERE_USED",
        "R6_RISK_AND_QUALITY_CONTEXT_WHERE_USED",
      ],
      [],
    ),
    {
      node: "R9",
      canonicalDependencies: [
        "CLASSIFICATION_VERSION",
        "R6_READINESS_STATE",
        "R7_READINESS_STATE",
        "R7_RECOMMENDATION_STATE",
        "R6_OVERALL_SCORE",
        "EVIDENCE_STATE",
        "VALUATION_STATE",
        "MOMENTUM_STATE",
        "OWNER_CONTEXT_VERSION",
        "R8_COMPLETE_CURRENT_ASSESSMENT_AND_LINEAGE",
        "PREVIOUS_COMPARABLE_R9_SEMANTIC_STATE",
        "R9_MATERIALITY_REGISTRY_VERSION",
      ],
      dependsOnNodes: [
        "R8_CORE_HEALTH",
        "R8_PORTFOLIO_FIT",
        "R8_PORTFOLIO_RISK",
        "R8_EXIT_INTELLIGENCE",
      ],
      noOpWhenDependencyFingerprintUnchanged: true,
    },
    {
      node: "R10",
      canonicalDependencies: [
        "CURRENT_R8_ASSESSMENT_AND_EXACT_LINEAGE",
        "CURRENT_R9_STATE_OR_EVENT_AND_EXACT_R8_LINEAGE",
        "OWNER_CONTEXT_VERSION",
        "OWNER_THRESHOLD_CONTEXT",
        "R10_PRECEDENCE_REGISTRY_VERSION",
      ],
      dependsOnNodes: [
        "R8_CORE_HEALTH",
        "R8_PORTFOLIO_FIT",
        "R8_PORTFOLIO_RISK",
        "R8_EXIT_INTELLIGENCE",
        "R9",
      ],
      noOpWhenDependencyFingerprintUnchanged: true,
    },
  ] as const

export const PROGRAM_D_R11_SEMANTIC_JOB_IDENTITY = {
  algorithm: "SHA-256",
  orderedFields: [
    "PROGRAM_D_D0_CONTRACT_VERSION",
    "PORTFOLIO_ID",
    "NORMALIZED_SUBJECT_SCOPE",
    "TRIGGER_TYPE",
    "CANONICAL_DEPENDENCY_FINGERPRINT",
    "POLICY_VERSION_SET",
    "ENGINE_VERSION_SET",
  ],
  randomRunIdIsSemanticAuthority: false,
} as const

export const PROGRAM_D_R11_NO_OP_RULES = [
  "IDENTICAL_CANONICAL_DEPENDENCY_FINGERPRINT",
  "DUPLICATE_SEMANTIC_TRIGGER",
  "UNCHANGED_ACCEPTED_EVIDENCE",
  "RUN_ID_ONLY_CHANGED",
  "UNCHANGED_OWNER_CONTEXT",
  "UNCHANGED_METHODOLOGY_ASSIGNMENT_OR_POLICY_VERSION",
  "MARKET_HISTORY_ALREADY_CURRENT_FOR_REQUIRED_WINDOW",
  "RESEARCH_DOMAIN_ALREADY_FRESH",
] as const

export const PROGRAM_D_PROVIDER_CONTROL_REUSE = {
  research: {
    providerControls: "REUSE_PROVIDER_INGESTION_CONTROLS",
    usageAccounting: "REUSE_PROVIDER_USAGE_EVENTS",
    budgetReservation: "REUSE_RESERVE_PROVIDER_BUDGET_V1",
    budgetSettlement: "REUSE_SETTLE_PROVIDER_BUDGET_V1",
    acquisitionLease: "REUSE_DATA_INGESTION_LEASE_WHERE_SCOPE_MATCHES",
    freshnessState: "REUSE_SECURITY_REFRESH_STATES",
    domainPolicy: "REUSE_REFRESH_DOMAIN_POLICIES",
  },
  marketData: {
    refreshRuns: "REUSE_MARKET_DATA_REFRESH_RUNS",
    operationLease: "REUSE_WITH_D1_SCHEDULER_HARDENING",
    cacheAndHistory: "REUSE_MARKET_PRICE_LATEST_AND_HISTORY",
  },
  programD: {
    deterministicChainLease: "NEW_SEMANTIC_REQUIREMENT_PERSISTENCE_SEPARATELY_GATED",
    operationalLedger: "NEW_SEMANTIC_REQUIREMENT_PERSISTENCE_SEPARATELY_GATED",
  },
} as const

export const PROGRAM_D_KILL_SWITCH_ORDER = [
  "GLOBAL_AUTOMATION",
  "PROVIDER",
  "DOMAIN",
] as const

export const PROGRAM_D_RETRY_CLASSES = {
  retryable: ["TRANSIENT_PROVIDER", "TRANSIENT_RUNTIME"] as const,
  nonRetryable: [
    "AUTHENTICATION_FAILURE",
    "AUTHORIZATION_FAILURE",
    "BUDGET_DENIAL",
    "KILL_SWITCH",
    "IDENTITY_MAPPING_CONFLICT",
    "PROVIDER_SCHEMA_CONFLICT",
    "INVALID_CANONICAL_EVIDENCE",
    "DETERMINISTIC_INVALID_INPUT",
    "AUTHORITY_CONFLICT",
  ] as const,
  exhaustedState: "REVIEW_DEAD_LETTER",
} as const

export const PROGRAM_D_DURABILITY_RESTART_MATRIX = [
  {
    domain: "RESEARCH_EVIDENCE",
    durableToday: true,
    restartDecision: "REUSE_CANONICAL_DURABLE_STATE",
  },
  {
    domain: "MARKET_HISTORY",
    durableToday: true,
    restartDecision: "REUSE_CANONICAL_DURABLE_STATE",
  },
  {
    domain: "R6_RESULT",
    durableToday: false,
    restartDecision: "RECOMPUTE_FROM_CANONICAL_INPUTS_WHEN_ELIGIBLE",
  },
  {
    domain: "R7_RESULT",
    durableToday: false,
    restartDecision: "RECOMPUTE_FROM_VALID_CURRENT_R6_AND_POLICY_INPUTS",
  },
  {
    domain: "R8_RESULT",
    durableToday: false,
    restartDecision: "RECOMPUTE_FROM_CURRENT_CANONICAL_DEPENDENCIES",
  },
  {
    domain: "R9_PREVIOUS_COMPARABLE_STATE",
    durableToday: false,
    restartDecision: "MODEL_B_MINIMAL_COMPLETE_SEMANTIC_CHECKPOINT_REQUIRED",
  },
  {
    domain: "R9_ACK_SNOOZE_SEEN_STATE",
    durableToday: false,
    restartDecision: "DEFERRED_NOT_CORE_R11",
  },
  {
    domain: "R10_ACTION_CENTER",
    durableToday: false,
    restartDecision: "RECOMPUTE_NO_CORE_R11_DURABLE_SNAPSHOT",
  },
] as const

export const PROGRAM_D_R9_DURABILITY_DECISION = {
  model: "MODEL_B_MINIMAL_COMPLETE_SEMANTIC_CHECKPOINT_REQUIRED",
  reason:
    "Current R9 prior state is process-memory only and the complete semantic prior ProgramCR9ObservedState cannot be proven exactly reconstructable from durable historical R6-R8 outputs because those outputs are non-persisting today.",
  checkpointMustContain: [
    "PORTFOLIO_ID",
    "SECURITY_ID",
    "OBSERVED_STATE_VERSION",
    "COMPLETE_PREVIOUS_COMPARABLE_PROGRAM_C_R9_OBSERVED_STATE",
    "OBSERVED_STATE_ID",
    "CANONICAL_DEPENDENCY_HASH",
    "LINEAGE",
    "SUCCESSFUL_PROCESSING_CHECKPOINT",
    "CREATED_AT",
  ],
  identityHashAloneSufficient: false,
  schemaCreationAuthorizedInD0: false,
  persistenceAuthorizedInD0: false,
} as const

export const PROGRAM_D_R10_SNAPSHOT_DECISION = {
  coreR11DurableSnapshotRequired: false,
  canonicalAuthority: "R10_RECOMPUTATION",
  failureBehavior: [
    "PRESERVE_CANONICAL_UPSTREAM_FACTS",
    "REPORT_OPERATIONAL_FAILURE_OR_STALENESS",
    "DO_NOT_FABRICATE_REPLACEMENT_R10_STATE",
  ],
  futureOperationalSnapshotRequiresSeparateOwnerApproval: true,
} as const

export const PROGRAM_D_OPERATIONAL_STATES = [
  "PLANNED",
  "QUEUED",
  "RUNNING",
  "NO_OP",
  "SUCCEEDED",
  "PARTIAL",
  "FAILED",
  "RETRY_SCHEDULED",
  "RETRY_EXHAUSTED",
  "BLOCKED_KILL_SWITCH",
  "BLOCKED_BUDGET",
  "BLOCKED_LEASE",
  "BLOCKED_AUTHORITY",
  "REVIEW_REQUIRED",
] as const

export const PROGRAM_D_R11_VALIDATION_FIXTURES = [
  "FRESH",
  "STALE",
  "MISSING",
  "CONFLICTING",
  "GLOBAL_DISABLED",
  "PROVIDER_DISABLED",
  "BUDGET_EXHAUSTED",
  "LEASE_OCCUPIED",
  "PARTIAL_PROVIDER_SUCCESS",
  "UNCHANGED_INPUT",
  "DEPENDENCY_CHANGED",
  "DOWNSTREAM_FAILURE",
  "RESTART_RESUME",
  "DUPLICATE_TRIGGER",
  "MARKET_HISTORY_EMPTY",
  "MARKET_HISTORY_PARTIAL",
  "MARKET_HISTORY_CURRENT",
  "MARKET_HISTORY_GAP",
  "MARKET_HISTORY_ALREADY_COMPLETE",
  "R9_FIRST_OBSERVATION",
  "R9_NO_CHANGE",
  "R9_RAW_IMMATERIAL_CHANGE",
  "R9_MEANINGFUL_CHANGE",
  "R9_INCOMPARABLE",
  "R9_OUT_OF_ORDER",
] as const

export const PROGRAM_D_R12_OPTIONALITY = {
  allowedStates: [
    "DISABLED",
    "ON_DEMAND_ONLY",
    "BOUNDED_PILOT",
    "WEEKLY_SELECTED_SCOPE",
  ],
  initialImplementationModeIfD3Authorized: "ON_DEMAND_ONLY",
  deterministicDependencyOnR12: false,
  scheduledPortfolioWideAiInitiallyAuthorized: false,
} as const

export const PROGRAM_D_R12_FACT_PACKET_REQUIRED_SECTIONS = [
  "PACKET_IDENTITY_VERSION",
  "PORTFOLIO_SECURITY_IDENTITY",
  "REQUESTED_NARRATIVE_TYPE",
  "CANONICAL_EVIDENCE_REFERENCES_PROVENANCE",
  "R6_STATE_LINEAGE",
  "R7_STATE_LINEAGE",
  "R8_STATE_LINEAGE",
  "R9_COMPARISON_EVENT_STATE",
  "R10_CANONICAL_ACTION_CENTER_STATE_PRECEDENCE",
  "OWNER_CONTEXT",
  "BLOCKERS_UNKNOWNS",
  "CONTRADICTIONS",
  "TIMESTAMPS_FRESHNESS",
  "DISPLAY_SAFE_SOURCE_EXCERPTS",
] as const

export const PROGRAM_D_R12_INPUT_FIELD_TYPES = [
  "FACT",
  "DETERMINISTIC_STATE",
  "OWNER_CONTEXT",
  "UNCERTAINTY",
  "SOURCE_EXCERPT",
] as const

export const PROGRAM_D_R12_OUTPUT_TYPES = [
  "AI_SUMMARY",
  "AI_INTERPRETATION",
] as const

export const PROGRAM_D_R12_REJECTION_RULES = {
  unsupportedNumber: "REJECTED_UNSUPPORTED_FACT",
  unresolvedCitation: "REJECTED_UNSUPPORTED_CITATION",
  fabricatedFact: "REJECTED_UNSUPPORTED_FACT",
  tradeInstruction: "REJECTED_AUTHORITY_CONFLICT",
  competingR10ActionOrPriority: "REJECTED_AUTHORITY_CONFLICT",
  deterministicOverride: "REJECTED_AUTHORITY_CONFLICT",
} as const

export const PROGRAM_D_OWNER_APPROVAL_GATES = [
  "D1_IMPLEMENTATION",
  "MIGRATION_CREATION",
  "LOCAL_MIGRATION_APPLICATION",
  "REMOTE_MIGRATION_APPLICATION",
  "R9_CHECKPOINT_PERSISTENCE",
  "R10_OPERATIONAL_SNAPSHOT_PERSISTENCE",
  "REAL_PROVIDER_PILOT",
  "TRENDLYNE_AUTOMATION",
  "ANGEL_ONE_AUTOMATION",
  "AUTOMATIC_R6_R10_RECOMPUTATION",
  "ANY_SCHEDULER_ENABLEMENT",
  "RECURRING_PROVIDER_SPEND",
  "R12_START",
  "REAL_AI_PROVIDER_PILOT",
  "SCHEDULED_OR_PORTFOLIO_WIDE_AI",
  "NOTIFICATIONS",
  "PRODUCTION_READINESS_DECLARATION",
  "PRODUCTION_ENABLEMENT",
  "MERGE_OR_DEPLOYMENT",
  "FUTURE_TRADING_CAPABILITY",
] as const
