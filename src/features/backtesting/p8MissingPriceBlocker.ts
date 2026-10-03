export const P8_B3_MISSING_PRICE_POLICY_VERSION = "P8_B3_MISSING_PRICE_BLOCKER_V1" as const

export type P8B3MissingPriceBlocker =
  | "NO_TRADE_ON_DECISION_DATE"
  | "PRICE_IDENTITY_NOT_RESOLVED"
  | "SOURCE_ROW_EXCLUDED_BY_FROZEN_SECURITY_TYPE"
  | "RAW_PRICE_REQUIRED_BUT_UNAVAILABLE"
  | "COMPLEX_CORPORATE_ACTION_BLOCKER"

export function classifyP8B3MissingPriceBlocker(args: {
  eligible: boolean
  sameDayBoundPrice: boolean
  officialSourceDatePresent: boolean
  sourceRowForIsinPresent?: boolean
  sourceRowExcludedBySecurityType?: boolean
  unresolvedPriceIdentity?: boolean
  complexCorporateActionBlocker?: boolean
}): P8B3MissingPriceBlocker | null {
  if (!args.eligible || args.sameDayBoundPrice) return null
  if (args.complexCorporateActionBlocker) return "COMPLEX_CORPORATE_ACTION_BLOCKER"
  if (args.unresolvedPriceIdentity) return "PRICE_IDENTITY_NOT_RESOLVED"
  if (args.sourceRowExcludedBySecurityType) return "SOURCE_ROW_EXCLUDED_BY_FROZEN_SECURITY_TYPE"
  if (args.officialSourceDatePresent && !args.sourceRowForIsinPresent) return "NO_TRADE_ON_DECISION_DATE"
  return "RAW_PRICE_REQUIRED_BUT_UNAVAILABLE"
}
