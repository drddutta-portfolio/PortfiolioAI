import { buildPharmaRegulatoryEventPersistenceProposal } from "./pharmaRegulatoryEventPersistenceProposal"

export const PHARMA_REGULATORY_EVENT_MIGRATION_REPLAY_PLAN_VERSION = "PHARMA_REGULATORY_EVENT_MIGRATION_REPLAY_PLAN_V1" as const

export interface PharmaRegulatoryEventMigrationReplayPlan {
  readonly planVersion: typeof PHARMA_REGULATORY_EVENT_MIGRATION_REPLAY_PLAN_VERSION
  readonly status: "PREPARED_NOT_EXECUTED"
  readonly proposalSqlPath: "docs/sql/R4N_PHARMA_REGULATORY_EVENT_EVIDENCE_V1_MIGRATION_PROPOSAL.sql"
  readonly executionTarget: "LOCAL_SUPABASE_ONLY"
  readonly replayCommandTemplate: string
  readonly assertions: readonly {
    readonly code: string
    readonly phase: "PRE" | "IN_TRANSACTION" | "POST_ROLLBACK"
    readonly expected: string
  }[]
  readonly schemaApplyAuthorized: false
  readonly productionExecutionAuthorized: false
}

export function buildPharmaRegulatoryEventMigrationReplayPlan(
  securityId: string,
  assignmentVersion: number,
): PharmaRegulatoryEventMigrationReplayPlan {
  const proposal = buildPharmaRegulatoryEventPersistenceProposal(securityId, assignmentVersion)

  return {
    planVersion: PHARMA_REGULATORY_EVENT_MIGRATION_REPLAY_PLAN_VERSION,
    status: "PREPARED_NOT_EXECUTED",
    proposalSqlPath: proposal.migrationProposalPath,
    executionTarget: "LOCAL_SUPABASE_ONLY",
    replayCommandTemplate:
      "psql <LOCAL_DB_URL> -v ON_ERROR_STOP=1 -f docs/sql/R4N_PHARMA_REGULATORY_EVENT_EVIDENCE_V1_MIGRATION_PROPOSAL.sql",
    assertions: [
      {
        code: "PRE_EXISTING_OBJECT_ABSENT",
        phase: "PRE",
        expected: "research_regulatory_event_observations does not already exist",
      },
      {
        code: "CANONICAL_PREREQUISITES_PRESENT",
        phase: "PRE",
        expected: "securities, data_sources, data_source_records and immutable-evidence trigger function exist",
      },
      {
        code: "PROPOSED_TABLE_CREATED_IN_TRANSACTION",
        phase: "IN_TRANSACTION",
        expected: "research_regulatory_event_observations is created only inside the replay transaction",
      },
      {
        code: "RLS_ENABLED",
        phase: "IN_TRANSACTION",
        expected: "row-level security is enabled on the proposed event table",
      },
      {
        code: "AUTHENTICATED_MUTATION_DENIED",
        phase: "IN_TRANSACTION",
        expected: "authenticated has no INSERT, UPDATE or DELETE privilege",
      },
      {
        code: "SERVICE_ROLE_MUTATION_ALLOWED",
        phase: "IN_TRANSACTION",
        expected: "service_role has mutation privileges on the proposed event table",
      },
      {
        code: "IMMUTABILITY_TRIGGER_PRESENT",
        phase: "IN_TRANSACTION",
        expected: "update/delete is blocked by portfolioai_reject_stage7_evidence_mutation",
      },
      {
        code: "SITE_SCOPE_CONSTRAINT_PRESENT",
        phase: "IN_TRANSACTION",
        expected: "scope is restricted to SITE_SPECIFIC and regulator to US_FDA",
      },
      {
        code: "CURRENT_STATE_VIEW_SECURITY_INVOKER",
        phase: "IN_TRANSACTION",
        expected: "current_research_regulatory_site_state_v1 is created with security_invoker = true",
      },
      {
        code: "ROLLBACK_REMOVES_PROPOSED_OBJECTS",
        phase: "POST_ROLLBACK",
        expected: "proposed table, view and US_FDA_OFFICIAL registry insert are absent after replay rollback",
      },
      {
        code: "MIGRATION_HISTORY_UNCHANGED",
        phase: "POST_ROLLBACK",
        expected: "no Supabase migration history entry is created because the proposal is outside supabase/migrations",
      },
    ],
    schemaApplyAuthorized: false,
    productionExecutionAuthorized: false,
  }
}
