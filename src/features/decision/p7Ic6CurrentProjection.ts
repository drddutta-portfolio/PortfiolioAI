import type { P7CurrentEvidenceSnapshot } from "../../data/p7CurrentIntelligenceRepository"

export const P7_CANONICAL_ACTION_STATES = [
  "ACCUMULATE",
  "HOLD",
  "WATCH",
  "REDUCE",
  "EXIT_REVIEW",
] as const

export type P7CanonicalActionState = typeof P7_CANONICAL_ACTION_STATES[number]
export type P7BlockedState = "INSUFFICIENT_EVIDENCE" | "STALE_REQUIRED_EVIDENCE" | "REVIEW_REQUIRED"

export interface P7Ic6CurrentProjection {
  readonly securityId: string
  readonly evidenceStatus: P7CurrentEvidenceSnapshot["snapshotStatus"]
  readonly r6State: P7BlockedState | "SCORED"
  readonly r7State: P7BlockedState | "CORE_CANDIDATE" | "SATELLITE_CANDIDATE" | "WATCH" | "AVOID"
  readonly r8State: "BLOCKED_PREREQUISITE" | "REVIEW_REQUIRED"
  readonly r9State: "BASELINE_NOT_AVAILABLE"
  readonly movementState: "INSUFFICIENT_EVIDENCE" | "REVIEW_REQUIRED"
  readonly actionState: P7CanonicalActionState | null
  readonly actionBlocker: "UPSTREAM_R6_R7_NOT_READY" | "R8_MOVEMENT_NOT_READY"
  readonly snapshot: P7CurrentEvidenceSnapshot
}

export function projectP7Ic6CurrentState(snapshot: P7CurrentEvidenceSnapshot): P7Ic6CurrentProjection {
  const review = snapshot.snapshotStatus === "REVIEW_REQUIRED" || snapshot.snapshotStatus === "CONFLICTING"
  const r6State: P7Ic6CurrentProjection["r6State"] = review
    ? "REVIEW_REQUIRED"
    : snapshot.snapshotStatus === "STALE"
      ? "STALE_REQUIRED_EVIDENCE"
      : snapshot.snapshotStatus === "READY"
        ? "SCORED"
        : "INSUFFICIENT_EVIDENCE"

  // A READY evidence snapshot alone is not an executed R6 score or R7 policy result.
  // Therefore this adapter can expose prerequisites but never manufacture candidacy.
  const r7State: P7Ic6CurrentProjection["r7State"] = review
    ? "REVIEW_REQUIRED"
    : snapshot.snapshotStatus === "STALE"
      ? "STALE_REQUIRED_EVIDENCE"
      : "INSUFFICIENT_EVIDENCE"

  const upstreamReady = r6State === "SCORED" && !["INSUFFICIENT_EVIDENCE", "STALE_REQUIRED_EVIDENCE", "REVIEW_REQUIRED"].includes(r7State)
  return {
    securityId: snapshot.securityId,
    evidenceStatus: snapshot.snapshotStatus,
    r6State,
    r7State,
    r8State: review ? "REVIEW_REQUIRED" : "BLOCKED_PREREQUISITE",
    r9State: "BASELINE_NOT_AVAILABLE",
    movementState: review ? "REVIEW_REQUIRED" : "INSUFFICIENT_EVIDENCE",
    actionState: null,
    actionBlocker: upstreamReady ? "R8_MOVEMENT_NOT_READY" : "UPSTREAM_R6_R7_NOT_READY",
    snapshot,
  }
}
