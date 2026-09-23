import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const root = process.cwd()
const classification = readFileSync(`${root}/supabase/functions/refresh-trendlyne-classification/index.ts`, "utf8")
const history = readFileSync(`${root}/supabase/functions/refresh-market-history/index.ts`, "utf8")
const complete = readFileSync(`${root}/supabase/functions/complete-research-refresh/index.ts`, "utf8")

describe("Program A A2 provider-control reuse", () => {
  it("requires the exact local-only A2 classification cohort and confirmation", () => {
    expect(classification).toContain('body.action === "A2_EXECUTE"')
    expect(classification).toContain('a2SecurityIds.length > 5')
    expect(classification).toContain('OWNER_CONFIRMED_PROGRAM_A_A2_CLASSIFICATION')
    expect(classification).toContain('UNEXPECTED_PRODUCTION_DB_TARGET')
    expect(classification).toContain('url.hostname === "kong" && url.port === "8000"')
    expect(classification).toContain('acquire_data_ingestion_lease_v1')
    expect(classification).toContain('reserve_provider_budget_v1')
    expect(classification).toContain('"User-Agent": "PortfolioAI/1.0"')
    expect(classification).toContain('PROVIDER_REMOTE_')
    expect(classification).toContain('CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING')
  })

  it("passes the approved incremental window into the existing Angel One adapter", () => {
    expect(history).toContain('readonly requestFrom?: unknown')
    expect(history).toContain('readonly requestTo?: unknown')
    expect(history).toContain('Program A A2 execution is local-only')
    expect(history).toContain('url.hostname === "kong" && url.port === "8000"')
    expect(history).toContain('to.getTime() - from.getTime() > HISTORY_DAYS * DAY')
    expect(history).toContain('getDailyHistory(instrument, kolkataDateTime(from), kolkataDateTime(to))')
    expect(history).toContain('acquire_market_data_operation_lease')
  })

  it("retains the reviewed R3 budget, lease, accounting, and canonical persistence path", () => {
    expect(complete).toContain('const RESERVED_UNITS = 4')
    expect(complete).toContain('reserve_provider_budget_v1')
    expect(complete).toContain('acquire_data_ingestion_lease_v1')
    expect(complete).toContain('record_provider_usage_event_v1')
    expect(complete).toContain('fundamental_observations')
    expect(complete).toContain('research_documents')
  })
})
