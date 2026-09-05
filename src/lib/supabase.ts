import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../supabase/types/database.types"
import { publicConfig } from "./config"

export const supabase = createClient<Database>(
  publicConfig.supabaseUrl,
  publicConfig.supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  },
)
