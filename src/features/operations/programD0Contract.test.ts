import { describe, expect, it } from "vitest"
import {
  PROGRAM_D_D0_AUTHORITY,
  PROGRAM_D_DURABILITY_RESTART_MATRIX,
  PROGRAM_D_KILL_SWITCH_ORDER,
  PROGRAM_D_OWNER_APPROVAL_GATES,
  PROGRAM_D_R10_SNAPSHOT_DECISION,
  PROGRAM_D_R11_DEPENDENCY_MATRIX,
  PROGRAM_D_R11_NO_OP_RULES,
  PROGRAM_D_R11_TRIGGER_TAXONOMY,
  PROGRAM_D_R12_REJECTION_RULES,
  PROGRAM_D_R9_DURABILITY_DECISION,
} from "./programD0Contract"

describe("Program D D0 frozen contract", () => {
  it("authorizes D0 only and keeps all execution side effects disabled", () => {
    expect(PROGRAM_D_D0_AUTHORITY.checkpoint).toBe("D0")
    expect(PROGRAM_D_D0_AUTHORITY.nextCheckpointAuthorized).toBe(false)
    expect(PROGRAM_D_D0_AUTHORITY.providerCallsAllowed).toBe(false)
    expect(PROGRAM_D_D0_AUTHORITY.aiCallsAllowed).toBe(false)
    expect(PROGRAM_D_D0_AUTHORITY.migrationCreationAllowed).toBe(false)
    expect(PROGRAM_D_D0_AUTHORITY.schedulerActivationAllowed).toBe(false)
    expect(PROGRAM_D_D0_AUTHORITY.productionMutationAllowed).toBe(false)
    expect(PROGRAM_D_D0_AUTHORITY.tradingAllowed).toBe(false)
  })

  it("uses a dependency DAG rather than a blind linear cascade", () => {
    const fit = PROGRAM_D_R11_DEPENDENCY_MATRIX.find(
      (entry) => entry.node === "R8_PORTFOLIO_FIT",
    )
    const risk = PROGRAM_D_R11_DEPENDENCY_MATRIX.find(
      (entry) => entry.node === "R8_PORTFOLIO_RISK",
    )
    expect(fit?.dependsOnNodes).not.toContain("R7")
    expect(risk?.dependsOnNodes).not.toContain("R7")
    expect(
      PROGRAM_D_R11_DEPENDENCY_MATRIX.every(
        (entry) => entry.noOpWhenDependencyFingerprintUnchanged,
      ),
    ).toBe(true)
  })

  it("freezes explicit no-op semantics", () => {
    expect(PROGRAM_D_R11_NO_OP_RULES).toContain("RUN_ID_ONLY_CHANGED")
    expect(PROGRAM_D_R11_NO_OP_RULES).toContain(
      "IDENTICAL_CANONICAL_DEPENDENCY_FINGERPRINT",
    )
  })

  it("requires restart-safe semantic R9 comparison state", () => {
    expect(PROGRAM_D_R9_DURABILITY_DECISION.model).toBe(
      "MODEL_B_MINIMAL_COMPLETE_SEMANTIC_CHECKPOINT_REQUIRED",
    )
    expect(PROGRAM_D_R9_DURABILITY_DECISION.identityHashAloneSufficient).toBe(false)
    expect(PROGRAM_D_R9_DURABILITY_DECISION.persistenceAuthorizedInD0).toBe(false)
  })

  it("does not create a durable R10 last-known-good authority", () => {
    expect(PROGRAM_D_R10_SNAPSHOT_DECISION.coreR11DurableSnapshotRequired).toBe(false)
    expect(PROGRAM_D_R10_SNAPSHOT_DECISION.canonicalAuthority).toBe(
      "R10_RECOMPUTATION",
    )
  })

  it("keeps all three kill-switch layers and owner gates explicit", () => {
    expect(PROGRAM_D_KILL_SWITCH_ORDER).toEqual([
      "GLOBAL_AUTOMATION",
      "PROVIDER",
      "DOMAIN",
    ])
    expect(PROGRAM_D_OWNER_APPROVAL_GATES).toContain("D1_IMPLEMENTATION")
    expect(PROGRAM_D_OWNER_APPROVAL_GATES).toContain("REAL_PROVIDER_PILOT")
    expect(PROGRAM_D_OWNER_APPROVAL_GATES).toContain("R12_START")
  })

  it("keeps provider-backed trigger execution separately gated", () => {
    const providerCapable = PROGRAM_D_R11_TRIGGER_TAXONOMY.filter(
      (trigger) => trigger.mayPlanProviderAcquisition,
    )
    expect(providerCapable.length).toBeGreaterThan(0)
    expect(
      providerCapable.every(
        (trigger) => trigger.ownerConfirmationRequiredForRealProviderExecution,
      ),
    ).toBe(true)
  })

  it("records current non-durability of R6/R7/R8/R9/R10 correctly", () => {
    const byDomain = new Map(
      PROGRAM_D_DURABILITY_RESTART_MATRIX.map((entry) => [entry.domain, entry]),
    )
    expect(byDomain.get("R6_RESULT")?.durableToday).toBe(false)
    expect(byDomain.get("R7_RESULT")?.durableToday).toBe(false)
    expect(byDomain.get("R8_RESULT")?.durableToday).toBe(false)
    expect(byDomain.get("R9_PREVIOUS_COMPARABLE_STATE")?.durableToday).toBe(false)
    expect(byDomain.get("R10_ACTION_CENTER")?.durableToday).toBe(false)
  })

  it("rejects AI authority conflicts", () => {
    expect(PROGRAM_D_R12_REJECTION_RULES.competingR10ActionOrPriority).toBe(
      "REJECTED_AUTHORITY_CONFLICT",
    )
    expect(PROGRAM_D_R12_REJECTION_RULES.tradeInstruction).toBe(
      "REJECTED_AUTHORITY_CONFLICT",
    )
  })
})
