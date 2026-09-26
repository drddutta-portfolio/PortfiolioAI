export const P4_MARKET_HISTORY_DEVELOPMENT_REF = "lrgpjimipfkyoqbpsqzz" as const
export const P4_MARKET_HISTORY_PRODUCTION_REF = "uxiyufbsbgzzdujzcdxe" as const
export const P4_MARKET_HISTORY_PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2" as const
export const P4_MARKET_HISTORY_CONFIRMATION = "OWNER_CONFIRMED_POST_D_P4A3_MARKET_HISTORY" as const

const P4_ALLOWED_SECURITY_IDS = new Set([
  "b47b007d-1990-4504-a5a2-4391c07687c5",
  "da69b3eb-0343-44f8-912c-288b826118cc",
  "fccdb05a-de17-441f-942d-add1a8a07f92",
  "fdec39e9-08a7-418d-ae96-9d8ce834d26c",
  "6771f493-c29a-477e-8cc8-2bede0941e44",
])

function projectRef(value: string): string | null {
  try {
    const match = new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export function assertP4MarketHistoryRequest(input: {
  readonly supabaseUrl: string
  readonly portfolioId: unknown
  readonly securityId: unknown
  readonly confirmation: unknown
}): { readonly ok: true } | { readonly ok: false; readonly code: string; readonly message: string } {
  const ref = projectRef(input.supabaseUrl)
  if (ref === P4_MARKET_HISTORY_PRODUCTION_REF) {
    return { ok: false, code: "UNEXPECTED_PRODUCTION_DB_TARGET", message: "P4 market-history execution refuses Production." }
  }
  if (ref !== P4_MARKET_HISTORY_DEVELOPMENT_REF) {
    return { ok: false, code: "UNAPPROVED_DEVELOPMENT_DB_TARGET", message: "P4 market-history execution requires PortfolioAI Dev." }
  }
  if (input.portfolioId !== P4_MARKET_HISTORY_PORTFOLIO_ID) {
    return { ok: false, code: "PORTFOLIO_SCOPE_MISMATCH", message: "P4 market-history execution requires the frozen Development acceptance portfolio." }
  }
  if (typeof input.securityId !== "string" || !P4_ALLOWED_SECURITY_IDS.has(input.securityId)) {
    return { ok: false, code: "SECURITY_SCOPE_MISMATCH", message: "Security is outside the approved P4A-3 exact cohort." }
  }
  if (input.confirmation !== P4_MARKET_HISTORY_CONFIRMATION) {
    return { ok: false, code: "AUTH_OR_CONFIG_ERROR", message: "Exact P4A-3 owner confirmation is required." }
  }
  return { ok: true }
}
