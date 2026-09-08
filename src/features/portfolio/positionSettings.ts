import Decimal from "decimal.js"
import type { PortfolioRole } from "./types"

export const ASSIGNABLE_ROLES = ["CORE", "SATELLITE", "THEMATIC", "ETF", "OTHER"] as const
export type AssignableRole = Exclude<PortfolioRole, "UNCLASSIFIED">

export interface PositionSettingsDraft {
  readonly portfolioRole: AssignableRole | null
  readonly targetWeight: string
  readonly minimumWeight: string
  readonly maximumWeight: string
  readonly priority: string
  readonly isWatchlisted: boolean
  readonly isFrozen: boolean
  readonly investmentHorizon: string
  readonly notes: string
}

export interface ValidatedPositionSettings {
  readonly portfolioRole: AssignableRole
  readonly targetWeight: string | null
  readonly minimumWeight: string | null
  readonly maximumWeight: string | null
  readonly priority: number | null
  readonly isWatchlisted: boolean
  readonly isFrozen: boolean
  readonly investmentHorizon: string | null
  readonly notes: string | null
}

function weight(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  let parsed: Decimal
  try { parsed = new Decimal(trimmed) } catch { throw new Error(`${label} must be a valid percentage.`) }
  if (!parsed.isFinite() || parsed.lt(0) || parsed.gt(100)) throw new Error(`${label} must be between 0 and 100.`)
  if (parsed.decimalPlaces() > 6) throw new Error(`${label} supports at most 6 decimal places.`)
  return parsed.toFixed()
}

export function validatePositionSettings(draft: PositionSettingsDraft): ValidatedPositionSettings {
  if (!draft.portfolioRole) throw new Error("Choose a portfolio role before saving settings.")
  if (!ASSIGNABLE_ROLES.includes(draft.portfolioRole)) throw new Error("The selected portfolio role is invalid.")
  const minimumWeight = weight(draft.minimumWeight, "Minimum weight")
  const targetWeight = weight(draft.targetWeight, "Target weight")
  const maximumWeight = weight(draft.maximumWeight, "Maximum weight")
  if (minimumWeight && targetWeight && new Decimal(minimumWeight).gt(targetWeight)) throw new Error("Minimum weight cannot exceed target weight.")
  if (targetWeight && maximumWeight && new Decimal(targetWeight).gt(maximumWeight)) throw new Error("Target weight cannot exceed maximum weight.")
  if (minimumWeight && maximumWeight && new Decimal(minimumWeight).gt(maximumWeight)) throw new Error("Minimum weight cannot exceed maximum weight.")
  const priorityText = draft.priority.trim()
  const priority = priorityText ? Number(priorityText) : null
  if (priority !== null && (!Number.isSafeInteger(priority) || priority < 0)) throw new Error("Priority must be a non-negative whole number.")
  return {
    portfolioRole: draft.portfolioRole,
    targetWeight,
    minimumWeight,
    maximumWeight,
    priority,
    isWatchlisted: draft.isWatchlisted,
    isFrozen: draft.isFrozen,
    investmentHorizon: draft.investmentHorizon.trim() || null,
    notes: draft.notes.trim() || null,
  }
}
