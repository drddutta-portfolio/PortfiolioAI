import { invokeEdgeFunctionUnknown, unknownErrorMessage, unknownRecord } from "../lib/edgeFunction"

export type P5TerminalR6Disposition =
  | "SCORED"
  | "INSUFFICIENT_EVIDENCE"
  | "STALE_REQUIRED_EVIDENCE"
  | "CONFLICTING_EVIDENCE"
  | "REVIEW_REQUIRED"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "NOT_APPLICABLE"
  | "BLOCKED_PREREQUISITE"

export type P5TerminalR7Disposition =
  | "RECOMMENDATION_READY"
  | "INSUFFICIENT_EVIDENCE"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"
  | "BLOCKED_PREREQUISITE"

export interface P5TerminalDisposition {
  readonly securityId: string
  readonly symbol: string | null
  readonly assetClass: string | null
  readonly retrievedAt: string
  readonly p4PayloadHash: string | null
  readonly methodologyState: string | null
  readonly engineCode: string | null
  readonly profileCode: string | null
  readonly methodologyId: string | null
  readonly methodologyReason: string | null
  readonly assignmentId: string | null
  readonly assignmentVersion: string | null
  readonly methodologyRole: string | null
  readonly r6Disposition: P5TerminalR6Disposition
  readonly r6ReasonCodes: readonly string[]
  readonly scoreRunId: string | null
  readonly r7Disposition: P5TerminalR7Disposition
  readonly r7ReasonCodes: readonly string[]
  readonly recommendationRunId: string | null
  readonly sizingDisposition: string | null
}

interface P5TerminalResponse {
  readonly version: string
  readonly portfolioId: string
  readonly count: number
  readonly rows: readonly P5TerminalDisposition[]
}

export async function loadP5TerminalDispositions(
  portfolioId: string,
): Promise<readonly P5TerminalDisposition[]> {
  const result = await invokeEdgeFunctionUnknown("p6-terminal-disposition-read", { portfolioId })
  if (result.error) throw new Error(unknownErrorMessage(result.error, "P5 terminal disposition read failed."))
  const record = unknownRecord(result.data)
  if (!record || record.portfolioId !== portfolioId || !Array.isArray(record.rows)) {
    throw new Error("P5 terminal disposition response is invalid.")
  }
  return record.rows as unknown as readonly P5TerminalDisposition[]
}
