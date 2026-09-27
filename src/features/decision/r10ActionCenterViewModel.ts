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


function attentionStateLabel(value: ProgramCR10AttentionState) {
  const labels: Partial<Record<ProgramCR10AttentionState, string>> = {
    EXIT_REVIEW: "Exit review",
    REVIEW_REQUIRED: "Review required",
    BLOCKED_PREREQUISITE: "Waiting on prerequisites",
    EVIDENCE_REVIEW: "Evidence review",
    INSUFFICIENT_EVIDENCE: "Insufficient evidence",
    RISK_REVIEW: "Risk review",
    RECOMMENDATION_CHANGE_REVIEW: "Recommendation change",
    CONCENTRATION_REVIEW: "Concentration review",
    ROLE_REVIEW: "Portfolio role review",
    PORTFOLIO_FIT_REVIEW: "Portfolio fit review",
    THESIS_WEAKENING: "Thesis weakening",
    MONITOR: "Monitor",
    THESIS_STRENGTHENING: "Thesis strengthening",
    NO_ACTION_REQUIRED: "No action required",
    NOT_APPLICABLE: "Not applicable",
  }
  return labels[value] ?? pretty(value)
}

function reasonLabel(value: string) {
  const exact: Readonly<Record<string, string>> = {
    R8_BLOCKED_PREREQUISITE: "Required evidence or methodology is not ready",
    R8_INSUFFICIENT_EVIDENCE: "Required evidence is insufficient",
    UPSTREAM_REVIEW_REQUIRED: "Underlying research requires review",
    R10_AUTHORITATIVE_SIGNAL_CONFLICT: "Current decision signals conflict and require review",
    R9_RECOMMENDATION_CHANGE: "Recommendation state changed",
    R8_CONCENTRATION_REVIEW: "Position concentration requires review",
    R8_ROLE_COMPATIBILITY_REVIEW: "Portfolio role fit requires review",
    R8_PORTFOLIO_FIT_TENSION: "Portfolio fit requires review",
    R8_RISK_ELEVATED: "Portfolio risk is elevated",
    R8_RISK_CRITICAL_REVIEW: "Portfolio risk requires urgent review",
    R8_EXIT_RISK_ELEVATED: "Exit risk is elevated",
    R8_HARD_EXIT_REVIEW: "Exit conditions require review",
    OWNER_STOP_LOSS_THRESHOLD_REACHED: "Your stop-loss reference has been reached",
    OWNER_TARGET_PRICE_THRESHOLD_REACHED: "Your target-price reference has been reached",
    NO_CANONICAL_REVIEW_TRIGGER: "No current review trigger",
  }
  if (exact[value]) return exact[value]
  if (value.startsWith("R9_EVIDENCE_STATE_")) {
    return `Research evidence changed to ${pretty(value.replace("R9_EVIDENCE_STATE_", ""))}`
  }
  return pretty(value.replace(/^R(?:8|9|10)_/u, ""))
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
    stateLabel: attentionStateLabel(attention.state),
    severity: attention.severity,
    tone: tone(attention.severity),
    primaryReason: attention.reasons[0] ? reasonLabel(attention.reasons[0]) : "No current review trigger",
    reasonLabels: attention.reasons.map(reasonLabel),
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
