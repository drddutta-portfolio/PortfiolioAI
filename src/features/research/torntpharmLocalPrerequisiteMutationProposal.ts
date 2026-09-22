export const TORNTPHARM_LOCAL_PREREQUISITE_MUTATION_PROPOSAL_VERSION =
  "TORNTPHARM_LOCAL_PREREQUISITE_MUTATION_PROPOSAL_V1" as const

export interface TorntpharmLocalPrerequisiteMutationProposal {
  readonly proposalVersion: typeof TORNTPHARM_LOCAL_PREREQUISITE_MUTATION_PROPOSAL_VERSION
  readonly executionTarget: "LOCAL_SUPABASE_ONLY"
  readonly metricDefinitionRowsMaximum: 1
  readonly sourceRecordRowsMaximum: 4
  readonly fundamentalObservationRows: 0
  readonly approvalFlag: "PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES"
  readonly safeguards: readonly [
    "APPROVAL_FLAG_BEFORE_DB_DISCOVERY",
    "LOCAL_DATABASE_ONLY",
    "SOURCE_REGISTRY_APPROVAL_REQUIRED",
    "METRIC_CONFLICT_ABORT",
    "SOURCE_RECORD_CONFLICT_ABORT",
    "IDEMPOTENT_INSERTS",
    "POSTCONDITION_VERIFY"
  ]
  readonly executionApproved: false
  readonly executed: false
}

export function buildTorntpharmLocalPrerequisiteMutationProposal(): TorntpharmLocalPrerequisiteMutationProposal {
  return {
    proposalVersion: TORNTPHARM_LOCAL_PREREQUISITE_MUTATION_PROPOSAL_VERSION,
    executionTarget: "LOCAL_SUPABASE_ONLY",
    metricDefinitionRowsMaximum: 1,
    sourceRecordRowsMaximum: 4,
    fundamentalObservationRows: 0,
    approvalFlag: "PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES",
    safeguards: [
      "APPROVAL_FLAG_BEFORE_DB_DISCOVERY",
      "LOCAL_DATABASE_ONLY",
      "SOURCE_REGISTRY_APPROVAL_REQUIRED",
      "METRIC_CONFLICT_ABORT",
      "SOURCE_RECORD_CONFLICT_ABORT",
      "IDEMPOTENT_INSERTS",
      "POSTCONDITION_VERIFY",
    ],
    executionApproved: false,
    executed: false,
  }
}
