import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

const root = process.cwd()
const edge = readFileSync(`${root}/supabase/functions/run-nse-news-pipeline/index.ts`, "utf8")
const migration = readFileSync(`${root}/supabase/migrations_legacy/20260915_pre_r4n_baseline/20260913090000_prepare_n5_automated_nse_news_pipeline.sql`, "utf8")

describe("Stage N5 automated NSE news pipeline safety contract", () => {
  it("keeps scheduler and live mutation disabled in the preparation policy", () => {
    expect(migration).toContain('"dry_run_allowed":true')
    expect(migration).toContain('"manual_run_allowed":false')
    expect(migration).toContain('"scheduler_allowed":false')
    expect(migration).not.toContain("cron.schedule")
  })

  it("keeps the concurrency lease service-only", () => {
    expect(migration).toContain("alter table public.news_pipeline_leases enable row level security")
    expect(migration).toContain("revoke all on table public.news_pipeline_leases from public, anon, authenticated")
    expect(migration).toContain("grant execute on function public.acquire_news_pipeline_lease_v1")
    expect(migration).toContain("to service_role")
  })

  it("uses one official feed and bounded document work", () => {
    expect(edge).toContain("Online_announcements.xml")
    expect(edge).toContain("MAX_LINKED_DOCUMENT_FETCHES = 3")
    expect(edge).toContain("MAX_LINKED_DOCUMENT_WORK_ITEMS = 3")
    expect(edge).toContain("MAX_MATCHED_ITEMS = 100")
    expect(edge).toContain('redirect: "manual"')
    expect(edge).toContain("parsed.hostname !== ALLOWED_HOST")
  })

  it("lets cached candidates pass without consuming missing-document work capacity", () => {
    expect(edge).toContain("for (const candidate of documentCandidates)")
    expect(edge).toContain("linkedDocumentWorkItems < MAX_LINKED_DOCUMENT_WORK_ITEMS")
    expect(edge).toContain("linkedDocumentFetches >= MAX_LINKED_DOCUMENT_FETCHES || linkedDocumentWorkItems >= MAX_LINKED_DOCUMENT_WORK_ITEMS")
    expect(edge).not.toContain("documentCandidates.slice(0, MAX_LINKED_DOCUMENT_FETCHES)")
  })

  it("keeps dry run free of canonical evidence, storage and freshness mutation", () => {
    expect(edge).toContain('action === "DRY_RUN"')
    expect(edge).toContain('safe_reason_code: "DRY_RUN_NO_MUTATION"')
    expect(edge).toContain("normalizedNewsWrites: 0")
    expect(edge).toContain("sourceRecordWrites: 0")
    expect(edge).toContain("storageWrites: 0")
    expect(edge).toContain("refreshStateMutation: false")
  })

  it("preserves official-source accounting without commercial-provider budget reservation", () => {
    expect(edge).toContain("data_ingestion_runs")
    expect(edge).toContain("data_ingestion_run_items")
    expect(edge).toContain("record_refresh_item_result_v1")
    expect(edge).toContain("provider_budget_reservations: 0")
    expect(edge).not.toContain("reserve_provider_budget_v1")
  })

  it("accounts HTTP attempts from request start and finalizes fatal planned items", () => {
    expect(edge.indexOf("externalFetchAttempts += 1")).toBeGreaterThan(-1)
    expect(edge.indexOf("externalFetchAttempts += 1")).toBeLessThan(edge.indexOf("fetchBounded(FEED_URL"))
    expect(edge).toContain("attempted_call_count: externalFetchAttempts")
    expect(edge).toContain('.eq("ingestion_run_id", runId).eq("status", "PLANNED")')
  })

  it("makes automated evidence identities stable across retries", () => {
    expect(edge).toContain("NSE:CORPORATE_ANNOUNCEMENTS:SHA256:")
    expect(edge).toContain("NSE:LINKED_DOCUMENT:")
    expect(edge).toContain("NSE:LINKED_DOCUMENT_TEXT:")
    expect(migration).toContain("data_source_records_nse_automation_external_key")
  })

  it("guards canonical appearance linkage rather than silently accepting a conflict", () => {
    expect(edge).toContain("APPEARANCE_NEWS_ITEM_CONFLICT")
  })

  it("keeps AI, OCR and extracted-text news mutation out of N5", () => {
    expect(migration).toContain('"ocr_enabled":false')
    expect(migration).toContain('"ai_enabled":false')
    expect(edge).toContain("normalized_news_writes: 0")
    expect(edge).not.toContain("OPENAI_API_KEY")
  })
})
