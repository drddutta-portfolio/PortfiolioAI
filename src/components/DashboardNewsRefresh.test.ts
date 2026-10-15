import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { isNewsRefreshHours } from "../data/newsRefreshRepository"

const root = process.cwd()
const migration = readFileSync(`${root}/supabase/migrations/20261015191500_restore_news_refresh_scheduler.sql`, "utf8")
const edge = readFileSync(`${root}/supabase/functions/run-nse-news-pipeline/index.ts`, "utf8")
const panel = readFileSync(`${root}/src/components/DashboardNewsPreview.tsx`, "utf8")

describe("News refresh recovery", () => {
  it("accepts only 1/3/6/12 hours", () => {
    for (const hours of [1,3,6,12]) expect(isNewsRefreshHours(hours)).toBe(true)
    for (const hours of [0,2,4,5,24,-1]) expect(isNewsRefreshHours(hours)).toBe(false)
  })
  it("schedules one hourly dispatcher and safely checks saved portfolio intervals", () => {
    expect(migration).toContain("interval_hours smallint not null default 6 check (interval_hours in (1,3,6,12))")
    expect(migration).toContain("coalesce(ns.interval_hours,6)")
    expect(migration).toContain("latest>now()-make_interval(hours=>p.interval_hours)")
    expect(migration).toContain("'portfolioai-n5-nse-news-hourly','0 * * * *'")
    expect(migration).toContain("'portfolioai-news-evidence-classification-hourly','5 * * * *'")
  })
  it("uses owner RLS and server-only credentials", () => {
    expect(migration).toContain("enable row level security")
    expect(migration).toContain("auth.uid()")
    expect(migration).toContain("vault.decrypted_secrets")
    expect(migration).toContain("NSE_NEWS_SCHEDULER_CONFIGURATION_INCOMPLETE")
    expect(migration).not.toMatch(/sb_secret_[A-Za-z0-9]+/)
    expect(edge).toContain('verify_news_pipeline_scheduler_token_v1')
    expect(panel).not.toContain("NEWS_PIPELINE_SCHEDULER_TOKEN")
  })
  it("never mislabels cached data as live", () => {
    expect(panel).not.toContain("Live · NSE")
    expect(panel).toContain("No confirmed scheduled scan")
    expect(panel).toContain("News refresh frequency")
  })
})
