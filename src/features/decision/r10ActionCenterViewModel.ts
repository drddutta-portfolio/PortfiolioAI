import { programCR10Precedence } from "./r10PrecedenceRegistry"
import type {
  ProgramCR10AttentionState,
  ProgramCR10IntegratedAttention,
  ProgramCR10Severity,
} from "./r10ActionCenterContract"

export type ProgramCR10Tone = "critical" | "warning" | "positive" | "neutral"

export interface ProgramCR10AttentionView {
  readonly id: string
  readonly securityId: string
  readonly symbol: string
  readonly company: string
  readonly state: ProgramCR10AttentionState
  readonly stateLabel: string
  readonly severity: ProgramCR10Severity
  readonly tone: ProgramCR10Tone
  readonly primaryReason: string
  readonly reasonLabels: readonly string[]
  readonly conflictLabels: readonly string[]
  readonly rank: number
}

function pretty(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function tone(severity: ProgramCR10Severity): ProgramCR10Tone {
  if (severity === "CRITICAL") return "critical"
  if (severity === "HIGH" || severity === "MEDIUM") return "warning"
  if (severity === "INFO") return "positive"
  return "neutral"
}

export function projectProgramCR10Attention(
  attention: ProgramCR10IntegratedAttention,
): ProgramCR10AttentionView {
  const precedence = programCR10Precedence(attention.state)
  return {
    id: attention.integratedAttentionId,
    securityId: attention.securityId,
    symbol: attention.symbol,
    company: attention.company,
    state: attention.state,
    stateLabel: pretty(attention.state),
    severity: attention.severity,
    tone: tone(attention.severity),
    primaryReason: attention.reasons[0] ? pretty(attention.reasons[0]) : "No canonical review trigger",
    reasonLabels: attention.reasons.map(pretty),
    conflictLabels: attention.conflicts.map((conflict) => conflict.summary),
    rank: precedence.rank,
  }
}

export function buildProgramCR10ActionCenterView(
  attentions: readonly ProgramCR10IntegratedAttention[],
) {
  return attentions
    .map(projectProgramCR10Attention)
    .sort((left, right) => (
      right.rank - left.rank
      || left.symbol.localeCompare(right.symbol)
      || left.id.localeCompare(right.id)
    ))
}
