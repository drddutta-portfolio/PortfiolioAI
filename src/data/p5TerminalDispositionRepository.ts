import { asEdgeFunctionError, invokeEdgeFunction } from "../lib/edgeFunction"

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


function isP5TerminalDisposition(value: unknown): value is P5TerminalDisposition {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const row = value as Record<string, unknown>
  return typeof row.securityId === "string"
    && typeof row.retrievedAt === "string"
    && Array.isArray(row.r6ReasonCodes)
    && Array.isArray(row.r7ReasonCodes)
    && typeof row.r6Disposition === "string"
    && typeof row.r7Disposition === "string"
}

function isP5TerminalResponse(value: unknown, portfolioId: string): value is P5TerminalResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return record.portfolioId === portfolioId
    && typeof record.version === "string"
    && typeof record.count === "number"
    && Array.isArray(record.rows)
    && record.rows.every(isP5TerminalDisposition)
}

export async function loadP5TerminalDispositions(
  portfolioId: string,
): Promise<readonly P5TerminalDisposition[]> {
  const result = await invokeEdgeFunction("p6-terminal-disposition-read", { portfolioId },
  )
  if (result.error) throw asEdgeFunctionError(result.error, "P5 terminal disposition read failed.")
  if (!isP5TerminalResponse(result.data, portfolioId)) {
    throw new Error("P5 terminal disposition response is invalid.")
  }
  return result.data.rows
}
