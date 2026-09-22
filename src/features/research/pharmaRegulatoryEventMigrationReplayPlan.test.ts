import { describe, expect, it } from "vitest"
import {
  buildPharmaRegulatoryEventMigrationReplayPlan,
  PHARMA_REGULATORY_EVENT_MIGRATION_REPLAY_PLAN_VERSION,
} from "./pharmaRegulatoryEventMigrationReplayPlan"

const SECURITY_ID = "11111111-1111-4111-8111-111111111111"

describe("Pharma regulatory event migration replay plan", () => {
  it("prepares a local-only non-applying replay plan", () => {
    const plan = buildPharmaRegulatoryEventMigrationReplayPlan(SECURITY_ID, 1)
    expect(plan.planVersion).toBe(PHARMA_REGULATORY_EVENT_MIGRATION_REPLAY_PLAN_VERSION)
    expect(plan.status).toBe("PREPARED_NOT_EXECUTED")
    expect(plan.executionTarget).toBe("LOCAL_SUPABASE_ONLY")
    expect(plan.schemaApplyAuthorized).toBe(false)
    expect(plan.productionExecutionAuthorized).toBe(false)
  })

  it("replays the proposal SQL rather than a Supabase migration", () => {
    const plan = buildPharmaRegulatoryEventMigrationReplayPlan(SECURITY_ID, 1)
    expect(plan.proposalSqlPath).toContain("docs/sql/")
    expect(plan.proposalSqlPath).not.toContain("supabase/migrations")
    expect(plan.replayCommandTemplate).toContain("-v ON_ERROR_STOP=1")
    expect(plan.replayCommandTemplate).toContain(plan.proposalSqlPath)
  })

  it("requires RLS, immutability, site scope and service-role-only mutation checks", () => {
    const plan = buildPharmaRegulatoryEventMigrationReplayPlan(SECURITY_ID, 1)
    const codes = plan.assertions.map((item) => item.code)
    expect(codes).toContain("RLS_ENABLED")
    expect(codes).toContain("AUTHENTICATED_MUTATION_DENIED")
    expect(codes).toContain("SERVICE_ROLE_MUTATION_ALLOWED")
    expect(codes).toContain("IMMUTABILITY_TRIGGER_PRESENT")
    expect(codes).toContain("SITE_SCOPE_CONSTRAINT_PRESENT")
    expect(codes).toContain("CURRENT_STATE_VIEW_SECURITY_INVOKER")
  })

  it("requires rollback and unchanged migration history after replay", () => {
    const plan = buildPharmaRegulatoryEventMigrationReplayPlan(SECURITY_ID, 1)
    const post = plan.assertions.filter((item) => item.phase === "POST_ROLLBACK")
    expect(post.map((item) => item.code)).toEqual([
      "ROLLBACK_REMOVES_PROPOSED_OBJECTS",
      "MIGRATION_HISTORY_UNCHANGED",
    ])
  })
})
