export const P4_DEVELOPMENT_PROJECT_REF = "lrgpjimipfkyoqbpsqzz" as const
export const P4_PRODUCTION_PROJECT_REF = "uxiyufbsbgzzdujzcdxe" as const
export const P4_CLASSIFICATION_CONFIRMATION = "OWNER_CONFIRMED_POST_D_P4A1_CLASSIFICATION" as const
export const P4_CLASSIFICATION_MAX_SECURITY_COUNT = 2 as const

export function supabaseProjectRef(value: string): string | null {
  try {
    const host = new URL(value).hostname
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/u)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export function isApprovedP4DevelopmentSupabaseUrl(value: string): boolean {
  return supabaseProjectRef(value) === P4_DEVELOPMENT_PROJECT_REF
}

export function assertP4ExactCohortRequest(input: {
  readonly supabaseUrl: string
  readonly portfolioId: unknown
  readonly securityIds: readonly string[]
  readonly securityNames: readonly string[]
  readonly confirmation: unknown
}): { readonly ok: true } | { readonly ok: false; readonly code: string; readonly message: string } {
  const projectRef = supabaseProjectRef(input.supabaseUrl)
  if (projectRef === P4_PRODUCTION_PROJECT_REF) {
    return { ok: false, code: "UNEXPECTED_PRODUCTION_DB_TARGET", message: "P4 exact-cohort execution refuses the Production project." }
  }
  if (!isApprovedP4DevelopmentSupabaseUrl(input.supabaseUrl)) {
    return { ok: false, code: "UNAPPROVED_DEVELOPMENT_DB_TARGET", message: "P4 exact-cohort execution requires the approved Development project." }
  }
  if (input.confirmation !== P4_CLASSIFICATION_CONFIRMATION) {
    return { ok: false, code: "AUTH_OR_CONFIG_ERROR", message: "Exact P4A-1 confirmation is required." }
  }
  if (
    typeof input.portfolioId !== "string" ||
    input.securityIds.length < 1 ||
    input.securityIds.length > P4_CLASSIFICATION_MAX_SECURITY_COUNT ||
    new Set(input.securityIds).size !== input.securityIds.length ||
    input.securityNames.length !== input.securityIds.length ||
    input.securityNames.some((name) => typeof name !== "string" || name.trim().length === 0)
  ) {
    return { ok: false, code: "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING", message: "P4A-1 requires one or two unique exact security identities." }
  }
  return { ok: true }
}
