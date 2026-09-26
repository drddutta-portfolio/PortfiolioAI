export const PRODUCTION_SUPABASE_PROJECT_REF = "uxiyufbsbgzzdujzcdxe"
export const DEVELOPMENT_SUPABASE_PROJECT_REF = "lrgpjimipfkyoqbpsqzz"

export type EnvironmentIdentity = "DEVELOPMENT" | "LOCAL" | null

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase()
}

export function getSupabaseProjectRef(supabaseUrl: string) {
  try {
    const hostname = new URL(supabaseUrl).hostname
    const [projectRef] = hostname.split(".")
    return projectRef || null
  } catch {
    return null
  }
}

export function getEnvironmentIdentity(hostname: string): EnvironmentIdentity {
  const normalized = normalizeHostname(hostname)

  if (normalized === "localhost" || normalized === "127.0.0.1") {
    return "LOCAL"
  }

  if (normalized.includes("portfolioai-development")) {
    return "DEVELOPMENT"
  }

  return null
}

export function assertEnvironmentIsolation(
  supabaseUrl: string,
  hostname: string,
) {
  const identity = getEnvironmentIdentity(hostname)
  const projectRef = getSupabaseProjectRef(supabaseUrl)

  if (
    identity !== null &&
    projectRef === PRODUCTION_SUPABASE_PROJECT_REF
  ) {
    throw new Error(
      "Environment isolation violation: Development/local PortfolioAI cannot use the Production Supabase project.",
    )
  }

  if (
    identity === "DEVELOPMENT" &&
    projectRef !== DEVELOPMENT_SUPABASE_PROJECT_REF
  ) {
    throw new Error(
      "Environment isolation violation: PortfolioAI Development must use the approved Development Supabase project.",
    )
  }
}
