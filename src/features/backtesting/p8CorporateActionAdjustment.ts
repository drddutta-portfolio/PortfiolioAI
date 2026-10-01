import {
  P8_B3_ARITHMETIC_POLICY_VERSION,
  P8Decimal,
  canonicalDerivedDecimal,
  canonicalSourceDecimal,
  p8FiniteNonNegative,
  p8FinitePositive,
  type P8DecimalValue,
} from "./p8ArithmeticPolicy"

export const P8_B3_ADJUSTMENT_VERSION = "P8_B3_ADJUSTMENT_V2" as const

export type P8AdjustmentReady = {
  state: "READY"
  calculationVersion: typeof P8_B3_ADJUSTMENT_VERSION
  arithmeticPolicyVersion: typeof P8_B3_ARITHMETIC_POLICY_VERSION
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
  arithmeticPolicyVersion: typeof P8_B3_ARITHMETIC_POLICY_VERSION
  blockerReason: string
}

export type P8AdjustmentResult = P8AdjustmentReady | P8AdjustmentBlocked

/**
 * Exact split/consolidation adjustment from declared face-value terms only.
 *
 * Example: face value 10 -> 2 is a 5-for-1 split.
 * Historical pre-event prices are multiplied by 2/10 = 0.2.
 * Historical pre-event shares are multiplied by 10/2 = 5.
 */
export function calculateSplitFromFaceValues(
  oldFaceValue: P8DecimalValue,
  newFaceValue: P8DecimalValue,
): P8AdjustmentReady {
  const oldValue = p8FinitePositive(oldFaceValue, "oldFaceValue")
  const newValue = p8FinitePositive(newFaceValue, "newFaceValue")

  return {
    state: "READY",
    calculationVersion: P8_B3_ADJUSTMENT_VERSION,
    arithmeticPolicyVersion: P8_B3_ARITHMETIC_POLICY_VERSION,
    shareFactor: canonicalDerivedDecimal(oldValue.div(newValue)),
    priceBackAdjustmentFactor: canonicalDerivedDecimal(newValue.div(oldValue)),
  }
}

/**
 * Exact bonus adjustment from a declared "bonus shares for held shares" ratio.
 *
 * Example: bonus 1:1 -> shares double, historical pre-event prices halve.
 */
export function calculateBonusFromRatio(
  bonusShares: P8DecimalValue,
  heldShares: P8DecimalValue,
): P8AdjustmentReady {
  const bonus = p8FinitePositive(bonusShares, "bonusShares")
  const held = p8FinitePositive(heldShares, "heldShares")
  const postShares = new P8Decimal(held).plus(bonus)

  return {
    state: "READY",
    calculationVersion: P8_B3_ADJUSTMENT_VERSION,
    arithmeticPolicyVersion: P8_B3_ARITHMETIC_POLICY_VERSION,
    shareFactor: canonicalDerivedDecimal(postShares.div(held)),
    priceBackAdjustmentFactor: canonicalDerivedDecimal(held.div(postShares)),
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
  previousClose: P8DecimalValue
  exDateClose: P8DecimalValue
  cashDistributionPerShare: P8DecimalValue
}): P8AdjustmentReady {
  const previousClose = p8FinitePositive(args.previousClose, "previousClose")
  const exDateClose = p8FiniteNonNegative(args.exDateClose, "exDateClose")
  const cash = p8FiniteNonNegative(args.cashDistributionPerShare, "cashDistributionPerShare")

  return {
    state: "READY",
    calculationVersion: P8_B3_ADJUSTMENT_VERSION,
    arithmeticPolicyVersion: P8_B3_ARITHMETIC_POLICY_VERSION,
    cashDistributionPerShare: canonicalSourceDecimal(cash),
    referencePrice: canonicalSourceDecimal(previousClose),
    priceReturnLinkFactor: canonicalDerivedDecimal(exDateClose.div(previousClose)),
    totalReturnLinkFactor: canonicalDerivedDecimal(exDateClose.plus(cash).div(previousClose)),
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
    arithmeticPolicyVersion: P8_B3_ARITHMETIC_POLICY_VERSION,
    blockerReason: `${actionType}: ${cleanReason}`,
  }
}
