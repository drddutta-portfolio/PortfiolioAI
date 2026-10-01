import Decimal from "decimal.js"

export const P8_B3_ADJUSTMENT_VERSION = "P8_B3_ADJUSTMENT_V1" as const

export type P8AdjustmentReady = {
  state: "READY"
  calculationVersion: typeof P8_B3_ADJUSTMENT_VERSION
  shareFactor?: string
  priceBackAdjustmentFactor?: string
  cashDistributionPerShare?: string
  referencePrice?: string
  priceReturnLinkFactor?: string
  totalReturnLinkFactor?: string
}

export type P8AdjustmentBlocked = {
  state: "BLOCKED"
  calculationVersion: typeof P8_B3_ADJUSTMENT_VERSION
  blockerReason: string
}

export type P8AdjustmentResult = P8AdjustmentReady | P8AdjustmentBlocked

function finitePositive(value: Decimal.Value, name: string): Decimal {
  const parsed = new Decimal(value)
  if (!parsed.isFinite() || parsed.lte(0)) {
    throw new Error(`${name} must be finite and > 0`)
  }
  return parsed
}

function finiteNonNegative(value: Decimal.Value, name: string): Decimal {
  const parsed = new Decimal(value)
  if (!parsed.isFinite() || parsed.lt(0)) {
    throw new Error(`${name} must be finite and >= 0`)
  }
  return parsed
}

function canonicalDecimal(value: Decimal): string {
  return value.toSignificantDigits(30).toString()
}

/**
 * Exact split/consolidation adjustment from declared face-value terms only.
 *
 * Example: face value 10 -> 2 is a 5-for-1 split.
 * Historical pre-event prices are multiplied by 2/10 = 0.2.
 * Historical pre-event shares are multiplied by 10/2 = 5.
 */
export function calculateSplitFromFaceValues(
  oldFaceValue: Decimal.Value,
  newFaceValue: Decimal.Value,
): P8AdjustmentReady {
  const oldValue = finitePositive(oldFaceValue, "oldFaceValue")
  const newValue = finitePositive(newFaceValue, "newFaceValue")

  return {
    state: "READY",
    calculationVersion: P8_B3_ADJUSTMENT_VERSION,
    shareFactor: canonicalDecimal(oldValue.div(newValue)),
    priceBackAdjustmentFactor: canonicalDecimal(newValue.div(oldValue)),
  }
}

/**
 * Exact bonus adjustment from a declared "bonus shares for held shares" ratio.
 *
 * Example: bonus 1:1 -> shares double, historical pre-event prices halve.
 */
export function calculateBonusFromRatio(
  bonusShares: Decimal.Value,
  heldShares: Decimal.Value,
): P8AdjustmentReady {
  const bonus = finitePositive(bonusShares, "bonusShares")
  const held = finitePositive(heldShares, "heldShares")
  const postShares = held.plus(bonus)

  return {
    state: "READY",
    calculationVersion: P8_B3_ADJUSTMENT_VERSION,
    shareFactor: canonicalDecimal(postShares.div(held)),
    priceBackAdjustmentFactor: canonicalDecimal(held.div(postShares)),
  }
}

/**
 * Total-return link for a cash distribution using explicit exchange/company terms.
 * No dividend is inferred from a price drop.
 *
 * Daily price return link = ex-date close / previous close.
 * Daily total return link = (ex-date close + cash distribution per share) / previous close.
 */
export function calculateCashDividendReturnLink(args: {
  previousClose: Decimal.Value
  exDateClose: Decimal.Value
  cashDistributionPerShare: Decimal.Value
}): P8AdjustmentReady {
  const previousClose = finitePositive(args.previousClose, "previousClose")
  const exDateClose = finiteNonNegative(args.exDateClose, "exDateClose")
  const cash = finiteNonNegative(args.cashDistributionPerShare, "cashDistributionPerShare")

  return {
    state: "READY",
    calculationVersion: P8_B3_ADJUSTMENT_VERSION,
    cashDistributionPerShare: canonicalDecimal(cash),
    referencePrice: canonicalDecimal(previousClose),
    priceReturnLinkFactor: canonicalDecimal(exDateClose.div(previousClose)),
    totalReturnLinkFactor: canonicalDecimal(exDateClose.plus(cash).div(previousClose)),
  }
}

/**
 * Complex actions are deliberately blocked until the exact economic terms and
 * an approved deterministic treatment are available. A price discontinuity is
 * never accepted as a substitute for those terms.
 */
export function blockUnsupportedCorporateAction(
  actionType: "RIGHTS" | "MERGER" | "DEMERGER" | "OTHER",
  reason: string,
): P8AdjustmentBlocked {
  const cleanReason = reason.trim()
  if (!cleanReason) throw new Error("blocker reason is required")

  return {
    state: "BLOCKED",
    calculationVersion: P8_B3_ADJUSTMENT_VERSION,
    blockerReason: `${actionType}: ${cleanReason}`,
  }
}
