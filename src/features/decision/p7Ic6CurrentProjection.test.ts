import { describe, expect, it } from "vitest"
import type { P7CurrentEvidenceSnapshot } from "../../data/p7CurrentIntelligenceRepository"
import { P7_CANONICAL_ACTION_STATES, projectP7Ic6CurrentState } from "./p7Ic6CurrentProjection"

function snapshot(snapshotStatus: P7CurrentEvidenceSnapshot["snapshotStatus"]): P7CurrentEvidenceSnapshot {
  return {
    snapshotId: "snapshot", portfolioId: "portfolio", securityId: "security", asOfDate: "2026-09-30",
    snapshotStatus, profileCode: "PROFILE", subprofileCode: null, methodologyAuthority: "authority",
    methodologyVersion: "v1", classificationVersion: "v1", methodologyRole: "role",
    assignmentId: "assignment", assignmentVersion: "v1",
  }
}

describe("P7 IC6 current projection", () => {
  it("keeps the internal action enum canonical", () => {
    expect(P7_CANONICAL_ACTION_STATES).toEqual(["ACCUMULATE", "HOLD", "WATCH", "REDUCE", "EXIT_REVIEW"])
    expect(P7_CANONICAL_ACTION_STATES).not.toContain("BUY")
    expect(P7_CANONICAL_ACTION_STATES).not.toContain("SELL")
  })

  it.each(["INSUFFICIENT", "STALE", "CONFLICTING", "REVIEW_REQUIRED"] as const)(
    "fails closed for %s evidence without emitting an action",
    (state) => {
      const result = projectP7Ic6CurrentState(snapshot(state))
      expect(result.actionState).toBeNull()
      expect(result.actionBlocker).toBe("UPSTREAM_R6_R7_NOT_READY")
    },
  )

  it("does not treat evidence readiness as an executed R7 result or action", () => {
    const result = projectP7Ic6CurrentState(snapshot("READY"))
    expect(result.r6State).toBe("SCORED")
    expect(result.r7State).toBe("INSUFFICIENT_EVIDENCE")
    expect(result.actionState).toBeNull()
  })
})
