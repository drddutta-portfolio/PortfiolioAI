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

export const publicConfig = {
  supabaseUrl: requireEnvironmentVariable(
    "VITE_SUPABASE_URL",
    import.meta.env.VITE_SUPABASE_URL,
  ),
  supabasePublishableKey: requireEnvironmentVariable(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ),
}

export function getApplicationOrigin() {
  const configuredOrigin = import.meta.env.VITE_APP_URL?.trim()
  return normalizeOrigin(configuredOrigin || window.location.origin)
}
