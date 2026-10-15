import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

export type NewsRefreshHours = 1 | 3 | 6 | 12
export const NEWS_REFRESH_HOURS: readonly NewsRefreshHours[] = [1, 3, 6, 12]

export interface NewsRefreshStatus {
  intervalHours: NewsRefreshHours
  lastRunAt: string | null
  lastRunStatus: string | null
  health: string
}
const db = supabase as unknown as SupabaseClient

export function isNewsRefreshHours(hours: number): hours is NewsRefreshHours {
  return NEWS_REFRESH_HOURS.some((candidate) => candidate === hours)
}

export async function loadNewsRefreshStatus(portfolioId: string): Promise<NewsRefreshStatus> {
  const result = await db.rpc("news_refresh_status_v1", { p_portfolio_id: portfolioId })
  if (result.error) throw result.error
  const raw: unknown = result.data
  if (!raw || Array.isArray(raw) || typeof raw !== "object") throw new Error("Invalid news status response")
  const value = raw as Record<string, unknown>
  const hours = Number(value.interval_hours)
  if (!isNewsRefreshHours(hours)) throw new Error("Invalid news refresh preference")
  return {
    intervalHours: hours,
    lastRunAt: typeof value.last_run_at === "string" ? value.last_run_at : null,
    lastRunStatus: typeof value.last_run_status === "string" ? value.last_run_status : null,
    health: typeof value.health === "string" ? value.health : "UNKNOWN",
  }
}

export async function saveNewsRefreshHours(portfolioId: string, hours: NewsRefreshHours): Promise<void> {
  if (!isNewsRefreshHours(hours)) throw new Error("Invalid news refresh interval")
  const result = await db.from("portfolio_news_refresh_settings").upsert({
    portfolio_id: portfolioId,
    interval_hours: hours,
    updated_at: new Date().toISOString(),
  }, { onConflict: "portfolio_id" })
  if (result.error) throw result.error
}
