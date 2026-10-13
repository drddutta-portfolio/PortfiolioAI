/**
 * Bank current-display veto over the existing canonical selected requirement
 * records. This module NEVER computes READY or changes canonical selections.
 * A positive result is not authorization to present current READY: only a
 * fresh canonical evaluation can do that.
 */
export interface SelectedBankRequirement {
  readonly requirement_code: string
  readonly required: boolean
  readonly applicability: string
  readonly evidence_state: string
  readonly fresh_through: string | null
}

export type BankDisplayVeto = {
  readonly veto: true
  readonly reasons: readonly string[]
  readonly checkedAt: string
}

function cutoff(freshThrough: string | null): number | null {
  if (!freshThrough || /^\d{4}-\d{2}-\d{2}$/.test(freshThrough)) return null
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(freshThrough)
      || !/(?:Z|[+-]\d{2}:\d{2})$/.test(freshThrough)) return null
  const parsed = Date.parse(freshThrough)
  return Number.isFinite(parsed) ? parsed : null
}

export function bankCurrentDisplayVeto(
  requirements: readonly SelectedBankRequirement[],
  now: number,
): BankDisplayVeto {
  if (!Number.isFinite(now)) throw new Error("EFFECTIVE_READINESS_CLOCK_REQUIRED")
  const reasons: string[] = []
  if (!requirements.length) reasons.push("REQUIREMENT_SET_MISSING")
  for (const item of requirements) {
    if (!item.required || item.applicability !== "APPLICABLE") continue
    if (item.evidence_state !== "FRESH") {
      reasons.push(`${item.requirement_code}: ${item.evidence_state}`)
      continue
    }
    const until = cutoff(item.fresh_through)
    if (until === null) reasons.push(`${item.requirement_code}: FRESHNESS_CUTOFF_UNVERIFIED`)
    else if (until <= now) reasons.push(`${item.requirement_code}: FRESHNESS_EXPIRED`)
  }
  // Deliberate fail-close: a prior selected snapshot can *never* authorize
  // present-day READY, even if every stored individual cutoff is in the future.
  if (!reasons.length) reasons.push("CURRENT_CANONICAL_REVALIDATION_REQUIRED")
  return { veto: true, reasons, checkedAt: new Date(now).toISOString() }
}
