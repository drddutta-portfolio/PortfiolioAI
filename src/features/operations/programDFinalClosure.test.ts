import { describe, expect, it } from "vitest"
import {
  PROGRAM_D_FINAL_AUTHORIZED_SCOPE,
  PROGRAM_D_FINAL_BRANCH_AUDIT,
  PROGRAM_D_FINAL_PRODUCTION_STATE,
  buildProgramDFinalClosureAudit,
} from "./programDFinalClosure"

describe("Program D final authorized-scope closure audit", () => {
  it("passes every frozen D-FINAL safety and boundary check", async () => {
    const audit = await buildProgramDFinalClosureAudit()
    expect(audit.failed).toBe(0)
    expect(audit.passed).toBe(audit.total)
    expect(audit.total).toBe(12)
    expect(audit.closureCandidate).toBe(true)
  })

  it("keeps Program C and repository boundaries frozen", () => {
    expect(PROGRAM_D_FINAL_BRANCH_AUDIT.behindByAtAudit).toBe(0)
    expect(PROGRAM_D_FINAL_BRANCH_AUDIT.programCDecisionFilesModified).toBe(0)
    expect(PROGRAM_D_FINAL_BRANCH_AUDIT.supabaseMigrationFilesModified).toBe(0)
    expect(PROGRAM_D_FINAL_BRANCH_AUDIT.providerFunctionFilesModified).toBe(0)
    expect(PROGRAM_D_FINAL_BRANCH_AUDIT.schedulerFilesModified).toBe(0)
    expect(PROGRAM_D_FINAL_BRANCH_AUDIT.tradingFilesModified).toBe(0)
  })

  it("states production as disabled rather than implying readiness or activation", () => {
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.productionEnabled).toBe(false)
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.schedulerEnabled).toBe(false)
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.migrationsApplied).toBe(false)
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.realProviderPilotRun).toBe(false)
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.realAiPilotRun).toBe(false)
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.mergeAuthorized).toBe(false)
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.deploymentAuthorized).toBe(false)
  })

  it("keeps investment and trading authority absent", () => {
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.numericSizingAuthority).toBe("NONE")
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.addReviewPromoted).toBe(false)
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.trimReviewPromoted).toBe(false)
    expect(PROGRAM_D_FINAL_PRODUCTION_STATE.tradingAuthorized).toBe(false)
  })

  it("closes all authorized R11 and R12 checkpoints before final closure", () => {
    expect(PROGRAM_D_FINAL_AUTHORIZED_SCOPE).toMatchObject({
      d0: "COMPLETE_PASS_CLOSED",
      d1: "COMPLETE_PASS_CLOSED",
      d2: "COMPLETE_PASS_CLOSED",
      r11: "COMPLETE_PASS_CLOSED",
      d3: "COMPLETE_PASS_CLOSED",
      d4: "COMPLETE_PASS_CLOSED",
      r12: "COMPLETE_PASS_CLOSED",
      programD: "AWAITING_FINAL_LOCAL_VALIDATION",
    })
  })
})
