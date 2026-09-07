/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_APP_URL?: string
  readonly VITE_MARKET_DATA_ENABLED?: "true" | "false"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
