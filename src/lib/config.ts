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

const viteEnvironment = import.meta.env as unknown as Readonly<Record<string, unknown>>

function environmentString(name: string): string | undefined {
  const value = viteEnvironment[name]
  return typeof value === "string" ? value : undefined
}

const supabaseUrl = requireEnvironmentVariable(
  "VITE_SUPABASE_URL",
  environmentString("VITE_SUPABASE_URL"),
)

if (typeof window !== "undefined") {
  assertEnvironmentIsolation(supabaseUrl, window.location.hostname)
}

const configuredHistoryApiUrl = environmentString("VITE_HISTORY_API_URL")?.trim()

export const publicConfig = {
  supabaseUrl,
  supabasePublishableKey: requireEnvironmentVariable(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    environmentString("VITE_SUPABASE_PUBLISHABLE_KEY"),
  ),
  marketDataEnabled: environmentString("VITE_MARKET_DATA_ENABLED") === "true",
  historyApiUrl: configuredHistoryApiUrl
    ? normalizeOrigin(configuredHistoryApiUrl)
    : supabaseUrl.includes("lrgpjimipfkyoqbpsqzz")
      ? "https://portfolioai-history-dev-api.dr-d-dutta.workers.dev"
      : null,
}

export function getApplicationOrigin() {
  const configuredOrigin = environmentString("VITE_APP_URL")?.trim()
  return normalizeOrigin(configuredOrigin || window.location.origin)
}
