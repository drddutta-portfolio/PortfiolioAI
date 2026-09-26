export const P4_MARKET_MAPPING_DEVELOPMENT_REF = "lrgpjimipfkyoqbpsqzz" as const
export const P4_MARKET_MAPPING_PRODUCTION_REF = "uxiyufbsbgzzdujzcdxe" as const
export const P4_MARKET_MAPPING_PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2" as const
export const P4_MARKET_MAPPING_CONFIRMATION = "OWNER_CONFIRMED_POST_D_P4_MAPPING" as const
export const P4_BANKBARODA_SECURITY_ID = "6771f493-c29a-477e-8cc8-2bede0941e44" as const

function projectRef(value: string): string | null {
  try {
    return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1] ?? null
  } catch { return null }
}

export function assertP4MarketMappingRequest(input: {
  readonly supabaseUrl: string
  readonly portfolioId: unknown
  readonly securityId: unknown
  readonly confirmation: unknown
}): { readonly ok: true } | { readonly ok: false; readonly code: string; readonly message: string } {
  const ref = projectRef(input.supabaseUrl)
  if (ref === P4_MARKET_MAPPING_PRODUCTION_REF) return { ok: false, code: "UNEXPECTED_PRODUCTION_DB_TARGET", message: "P4 mapping execution refuses Production." }
  if (ref !== P4_MARKET_MAPPING_DEVELOPMENT_REF) return { ok: false, code: "UNAPPROVED_DEVELOPMENT_DB_TARGET", message: "P4 mapping execution requires PortfolioAI Dev." }
  if (input.portfolioId !== P4_MARKET_MAPPING_PORTFOLIO_ID) return { ok: false, code: "PORTFOLIO_SCOPE_MISMATCH", message: "P4 mapping execution requires the frozen Development portfolio." }
  if (input.securityId !== P4_BANKBARODA_SECURITY_ID) return { ok: false, code: "SECURITY_SCOPE_MISMATCH", message: "P4 mapping execution is limited to BANKBARODA." }
  if (input.confirmation !== P4_MARKET_MAPPING_CONFIRMATION) return { ok: false, code: "AUTH_OR_CONFIG_ERROR", message: "Exact P4 mapping confirmation is required." }
  return { ok: true }
}
