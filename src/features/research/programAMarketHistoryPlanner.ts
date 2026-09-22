export const PROGRAM_A_MARKET_HISTORY_PLAN_VERSION = "PROGRAM_A_A1_MARKET_HISTORY_V1" as const

const DAY_MS = 86_400_000

export type HistoryWindowMode = "NONE" | "FULL_BACKFILL" | "INCREMENTAL"

export interface IncrementalHistoryWindowInput {
  readonly requiredLookbackDays: number
  readonly asOfDate: string
  readonly earliestStoredCandle: string | null
  readonly latestStoredCandle: string | null
  readonly overlapDays: number
}
export interface IncrementalHistoryWindowPlan {
  readonly version: typeof PROGRAM_A_MARKET_HISTORY_PLAN_VERSION
  readonly mode: HistoryWindowMode
  readonly requiredStartDate: string
  readonly requestStartDate: string | null
  readonly requestEndDate: string | null
  readonly lookbackSatisfied: boolean
  readonly reasonCode: "NO_HISTORY" | "LOOKBACK_GAP" | "LATEST_CANDLE_GAP" | "HISTORY_CURRENT"
  readonly estimatedProviderCalls: 0 | 1
}

function parseDate(value: string, field: string): Date {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value.slice(0, 10)) || !Number.isFinite(date.valueOf())) {
    throw new Error(`${field} must be an ISO calendar date.`)
  }
  return date
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function shiftDays(date: Date, days: number) {
  return new Date(date.valueOf() + days * DAY_MS)
}

export function planIncrementalHistoryWindow(input: IncrementalHistoryWindowInput): IncrementalHistoryWindowPlan {
  if (!Number.isInteger(input.requiredLookbackDays) || input.requiredLookbackDays <= 0) throw new Error("requiredLookbackDays must be a positive integer.")
  if (!Number.isInteger(input.overlapDays) || input.overlapDays < 0) throw new Error("overlapDays must be a non-negative integer.")

  const asOf = parseDate(input.asOfDate, "asOfDate")
  const requiredStart = shiftDays(asOf, -input.requiredLookbackDays)
  const earliest = input.earliestStoredCandle ? parseDate(input.earliestStoredCandle, "earliestStoredCandle") : null
  const latest = input.latestStoredCandle ? parseDate(input.latestStoredCandle, "latestStoredCandle") : null
  if ((earliest === null) !== (latest === null)) throw new Error("earliestStoredCandle and latestStoredCandle must both be present or absent.")
  if (earliest && latest && earliest > latest) throw new Error("earliestStoredCandle cannot be after latestStoredCandle.")

  const requiredStartDate = isoDate(requiredStart)
  if (!earliest || !latest) {
    return {
      version: PROGRAM_A_MARKET_HISTORY_PLAN_VERSION,
      mode: "FULL_BACKFILL",
      requiredStartDate,
      requestStartDate: requiredStartDate,
      requestEndDate: isoDate(asOf),
      lookbackSatisfied: false,
      reasonCode: "NO_HISTORY",
      estimatedProviderCalls: 1,
    }
  }

  const lookbackSatisfied = earliest <= requiredStart
  if (!lookbackSatisfied) {
    return {
      version: PROGRAM_A_MARKET_HISTORY_PLAN_VERSION,
      mode: "FULL_BACKFILL",
      requiredStartDate,
      requestStartDate: requiredStartDate,
      requestEndDate: isoDate(asOf),
      lookbackSatisfied: false,
      reasonCode: "LOOKBACK_GAP",
      estimatedProviderCalls: 1,
    }
  }

  if (latest >= asOf) {
    return {
      version: PROGRAM_A_MARKET_HISTORY_PLAN_VERSION,
      mode: "NONE",
      requiredStartDate,
      requestStartDate: null,
      requestEndDate: null,
      lookbackSatisfied: true,
      reasonCode: "HISTORY_CURRENT",
      estimatedProviderCalls: 0,
    }
  }

  const overlapStart = shiftDays(latest, -input.overlapDays)
  return {
    version: PROGRAM_A_MARKET_HISTORY_PLAN_VERSION,
    mode: "INCREMENTAL",
    requiredStartDate,
    requestStartDate: isoDate(overlapStart < requiredStart ? requiredStart : overlapStart),
    requestEndDate: isoDate(asOf),
    lookbackSatisfied: true,
    reasonCode: "LATEST_CANDLE_GAP",
    estimatedProviderCalls: 1,
  }
}
