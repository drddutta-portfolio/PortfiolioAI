import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import {
  PROGRAM_D_FINAL_AUTHORIZED_SCOPE,
  PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT,
  buildProgramDFinalClosureAudit,
  type ProgramDFinalRepositoryEvidence,
} from "./programDFinalClosure"

function repositoryEvidence(): ProgramDFinalRepositoryEvidence {
  return JSON.parse(execFileSync("node", ["scripts/program-d-final-audit.mjs"], {
    encoding: "utf8",
  })) as ProgramDFinalRepositoryEvidence
}

describe("Program D final authorized-scope closure audit", () => {
  it("passes every frozen D-FINAL safety and boundary check", async () => {
    const audit = await buildProgramDFinalClosureAudit(repositoryEvidence())
    expect(audit.failed).toBe(0)
    expect(audit.passed).toBe(audit.total)
    expect(audit.total).toBe(12)
    expect(audit.closureCandidate).toBe(true)
  })

  it("keeps Program C and repository boundaries frozen", () => {
    const evidence = repositoryEvidence()
    expect(evidence.evidenceClass).toBe("EXECUTABLE_REPOSITORY_EVIDENCE")
    expect(evidence.branch).toBe(evidence.expectedBranch)
    expect(evidence.behind).toBe(0)
    expect(evidence.baseIsAncestor).toBe(true)
    expect(evidence.mergeCommitCount).toBe(0)
    expect(evidence.unexpectedFiles).toEqual([])
    expect(evidence.programCDecisionFilesModified).toBe(0)
    expect(evidence.researchAuthorityFilesModified).toBe(0)
    expect(evidence.supabaseMigrationFilesModified).toBe(0)
    expect(evidence.providerFunctionFilesModified).toBe(0)
    expect(evidence.schedulerFilesModified).toBe(0)
    expect(evidence.tradingFilesModified).toBe(0)
  })

  it("states production as disabled rather than implying readiness or activation", () => {
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.evidenceClass).toBe("MANUALLY_VERIFIED_SNAPSHOT")
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.productionEnabled).toBe(false)
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.schedulerEnabled).toBe(false)
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.migrationsApplied).toBe(false)
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.realProviderPilotRun).toBe(false)
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.realAiPilotRun).toBe(false)
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.mergeAuthorized).toBe(false)
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.deploymentAuthorized).toBe(false)
  })

  it("keeps investment and trading authority absent", () => {
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.numericSizingAuthority).toBe("NONE")
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.addReviewPromoted).toBe(false)
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.trimReviewPromoted).toBe(false)
    expect(PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.tradingAuthorized).toBe(false)
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
      programD: "COMPLETE_PASS_CLOSED",
    })
  })
})
