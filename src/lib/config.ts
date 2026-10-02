import { assertEnvironmentIsolation } from "./environment"

function requireEnvironmentVariable(name: string, value: string | undefined) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return normalized
}

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "")
}

const supabaseUrl = requireEnvironmentVariable(
  "VITE_SUPABASE_URL",
  import.meta.env.VITE_SUPABASE_URL,
)

if (typeof window !== "undefined") {
  assertEnvironmentIsolation(supabaseUrl, window.location.hostname)
}

export const publicConfig = {
  supabaseUrl,
  supabasePublishableKey: requireEnvironmentVariable(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ),
  marketDataEnabled: import.meta.env.VITE_MARKET_DATA_ENABLED === "true",
  historyApiUrl: import.meta.env.VITE_HISTORY_API_URL?.trim()
    ? normalizeOrigin(import.meta.env.VITE_HISTORY_API_URL.trim())
    : null,
}

export function getApplicationOrigin() {
  const configuredOrigin = import.meta.env.VITE_APP_URL?.trim()
  return normalizeOrigin(configuredOrigin || window.location.origin)
}
