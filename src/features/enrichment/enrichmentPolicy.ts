import Decimal from "decimal.js"
import type { SecurityEnrichment } from "./types"

export type MarketCapCategory = "LARGE_CAP" | "MID_CAP" | "SMALL_CAP" | "INSUFFICIENT_EVIDENCE"

export function classifyFullMarketCapRank(rank: number | null, universeSize: number | null): MarketCapCategory {
  if (rank === null || !Number.isInteger(rank) || rank < 1 || universeSize === null || universeSize < 251 || rank > universeSize) {
    return "INSUFFICIENT_EVIDENCE"
  }
  if (rank <= 100) return "LARGE_CAP"
  if (rank <= 250) return "MID_CAP"
  return "SMALL_CAP"
}

export interface ComparableMarketCap {
  readonly value: string
  readonly currency: string
  readonly basis: "FULL" | "FREE_FLOAT"
  readonly asOf: string
}

export type MarketCapComparison = "EQUIVALENT" | "CONFLICT" | "NOT_COMPARABLE"

export function aggregateEnrichmentState(
  states: readonly SecurityEnrichment["state"][],
  coverageComplete: boolean,
): SecurityEnrichment["state"] {
  if (!states.length || states.every((state) => state === "UNAVAILABLE")) return "UNAVAILABLE"
  if (states.includes("FAILED")) return "FAILED"
  if (states.includes("STALE")) return "STALE"
  if (coverageComplete && states.every((state) => state === "AVAILABLE")) return "AVAILABLE"
  return "PARTIAL"
}

export function compareMarketCaps(left: ComparableMarketCap, right: ComparableMarketCap): MarketCapComparison {
  if (left.currency !== right.currency || left.basis !== right.basis) return "NOT_COMPARABLE"
  const leftTime = Date.parse(left.asOf)
  const rightTime = Date.parse(right.asOf)
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return "NOT_COMPARABLE"
  const elapsedHours = Math.abs(leftTime - rightTime) / 3_600_000
  if (elapsedHours > 36) return "NOT_COMPARABLE"
  const larger = Decimal.max(new Decimal(left.value).abs(), new Decimal(right.value).abs())
  if (larger.isZero()) return "EQUIVALENT"
  const differencePercent = new Decimal(left.value).minus(right.value).abs().div(larger).times(100)
  const sameUtcDate = new Date(leftTime).toISOString().slice(0, 10) === new Date(rightTime).toISOString().slice(0, 10)
  return differencePercent.lte(sameUtcDate ? 1 : 5) ? "EQUIVALENT" : "CONFLICT"
}
