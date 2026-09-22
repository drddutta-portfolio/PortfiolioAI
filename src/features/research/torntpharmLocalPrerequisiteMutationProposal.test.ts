import { describe, expect, it } from "vitest"
import {
  buildTorntpharmLocalPrerequisiteMutationProposal,
  TORNTPHARM_LOCAL_PREREQUISITE_MUTATION_PROPOSAL_VERSION,
} from "./torntpharmLocalPrerequisiteMutationProposal"

describe("TORNTPHARM local prerequisite mutation proposal", () => {
  it("remains local-only and unapproved", () => {
    const result = buildTorntpharmLocalPrerequisiteMutationProposal()
    expect(result.proposalVersion).toBe(TORNTPHARM_LOCAL_PREREQUISITE_MUTATION_PROPOSAL_VERSION)
    expect(result.executionTarget).toBe("LOCAL_SUPABASE_ONLY")
    expect(result.executionApproved).toBe(false)
    expect(result.executed).toBe(false)
  })

  it("limits scope to one metric definition and four source records", () => {
    const result = buildTorntpharmLocalPrerequisiteMutationProposal()
    expect(result.metricDefinitionRowsMaximum).toBe(1)
    expect(result.sourceRecordRowsMaximum).toBe(4)
    expect(result.fundamentalObservationRows).toBe(0)
  })

  it("requires explicit approval before database discovery and preserves conflict guards", () => {
    const result = buildTorntpharmLocalPrerequisiteMutationProposal()
    expect(result.approvalFlag).toBe("PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES")
    expect(result.safeguards).toContain("APPROVAL_FLAG_BEFORE_DB_DISCOVERY")
    expect(result.safeguards).toContain("LOCAL_DATABASE_ONLY")
    expect(result.safeguards).toContain("METRIC_CONFLICT_ABORT")
    expect(result.safeguards).toContain("SOURCE_RECORD_CONFLICT_ABORT")
    expect(result.safeguards).toContain("IDEMPOTENT_INSERTS")
    expect(result.safeguards).toContain("POSTCONDITION_VERIFY")
  })
})
