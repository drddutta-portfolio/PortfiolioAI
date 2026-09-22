export const TORNTPHARM_LOCAL_OBSERVATION_MUTATION_PROPOSAL_VERSION =
  "TORNTPHARM_LOCAL_OBSERVATION_MUTATION_PROPOSAL_V1" as const

export interface TorntpharmLocalObservationMutationProposal {
  readonly proposalVersion: typeof TORNTPHARM_LOCAL_OBSERVATION_MUTATION_PROPOSAL_VERSION
  readonly executionTarget: "LOCAL_SUPABASE_ONLY"
  readonly observationRowsMaximum: 4
  readonly metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH"
  readonly values: readonly [
    { readonly periodEnd: "2025-06-30"; readonly value: "19" },
    { readonly periodEnd: "2025-09-30"; readonly value: "26" },
    { readonly periodEnd: "2025-12-31"; readonly value: "19" },
    { readonly periodEnd: "2026-03-31"; readonly value: "16" }
  ]
  readonly safeguards: readonly [
    "APPROVAL_FLAG_BEFORE_DB_DISCOVERY",
    "LOCAL_DATABASE_ONLY",
    "SECURITY_IDENTITY_UNIQUE",
    "REVIEWED_ASSIGNMENT_REQUIRED",
    "METRIC_CONTRACT_REQUIRED",
    "IMMUTABLE_SOURCE_RECORDS_REQUIRED",
    "EXISTING_FACT_CONFLICT_ABORT",
    "IDEMPOTENT_EXACT_FACT_SKIP",
    "POSTCONDITION_VERIFY"
  ]
  readonly executionApproved: false
  readonly executed: false
}

export function buildTorntpharmLocalObservationMutationProposal(): TorntpharmLocalObservationMutationProposal {
  return {
    proposalVersion: TORNTPHARM_LOCAL_OBSERVATION_MUTATION_PROPOSAL_VERSION,
    executionTarget: "LOCAL_SUPABASE_ONLY",
    observationRowsMaximum: 4,
    metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
    values: [
      { periodEnd: "2025-06-30", value: "19" },
      { periodEnd: "2025-09-30", value: "26" },
      { periodEnd: "2025-12-31", value: "19" },
      { periodEnd: "2026-03-31", value: "16" },
    ],
    safeguards: [
      "APPROVAL_FLAG_BEFORE_DB_DISCOVERY",
      "LOCAL_DATABASE_ONLY",
      "SECURITY_IDENTITY_UNIQUE",
      "REVIEWED_ASSIGNMENT_REQUIRED",
      "METRIC_CONTRACT_REQUIRED",
      "IMMUTABLE_SOURCE_RECORDS_REQUIRED",
      "EXISTING_FACT_CONFLICT_ABORT",
      "IDEMPOTENT_EXACT_FACT_SKIP",
      "POSTCONDITION_VERIFY",
    ],
    executionApproved: false,
    executed: false,
  }
}
