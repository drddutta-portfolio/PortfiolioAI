import type { ProgramCR10AttentionView } from "../features/decision/r10ActionCenterViewModel"
import "./ProgramCR10AttentionBadge.css"

export function ProgramCR10AttentionBadge({
  attention,
  compact = false,
}: {
  readonly attention: ProgramCR10AttentionView | null
  readonly compact?: boolean
}) {
  if (!attention) {
    return <span className="r10-attention-badge is-unavailable">Attention unavailable</span>
  }

  return <span
    className={`r10-attention-badge tone-${attention.tone}${compact ? " compact" : ""}`}
    title={[
      attention.primaryReason,
      ...attention.conflictLabels,
    ].join(" · ")}
  >
    <strong>{attention.stateLabel}</strong>
    {!compact ? <small>{attention.primaryReason}</small> : null}
    {attention.conflictLabels.length
      ? <em>{attention.conflictLabels.length} conflict{attention.conflictLabels.length === 1 ? "" : "s"}</em>
      : null}
  </span>
}
