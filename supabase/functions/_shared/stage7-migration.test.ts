// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const identity = readFileSync(new URL("../../migrations/20260908110000_create_stage7_provenance_and_security_identity.sql",import.meta.url),"utf8")
const enrichment = readFileSync(new URL("../../migrations/20260908111000_create_stage7_enrichment_observations.sql",import.meta.url),"utf8")
const policy = readFileSync(new URL("../../migrations/20260908112000_create_stage7_market_cap_policy_and_views.sql",import.meta.url),"utf8")
const leaseFix = readFileSync(new URL("../../migrations/20260908115000_fix_stage7_ingestion_lease_retry_after.sql",import.meta.url),"utf8")
const resilience = readFileSync(new URL("../../migrations/20260908120000_add_stage7_document_and_fundamental_reconciliation.sql",import.meta.url),"utf8")

describe("Stage 7 migration contracts", () => {
  it("keeps raw evidence immutable to browser roles and deduplicated", () => {
    expect(identity).toContain("payload_hash text not null")
    expect(identity).toContain("data_source_records_dedup_key")
    expect(identity).not.toMatch(/grant (?:insert|update|delete).*data_source_records.*authenticated/iu)
  })
  it("keeps Trendlyne provider configuration separate from canonical fields", () => {
    expect(identity).toContain("TRENDLYNE_MCP")
    expect(enrichment).not.toContain("trendlyne_")
  })
  it("makes browser reads cache-only through security-invoker views", () => {
    expect(policy.match(/security_invoker=true/gu)?.length).toBeGreaterThanOrEqual(6)
    expect(policy).toContain("current_security_enrichment_v1")
    expect(policy).not.toContain("http")
  })
  it("version-controls rank categories and reconciliation tolerances", () => {
    expect(policy).toContain("SEBI_AMFI_FULL_MARKET_CAP_RANK_V1")
    expect(policy).toContain("large_cap_max_rank")
    expect(policy).toContain("conflict_same_date_percent")
  })
  it("uses valid unqualified PostgreSQL GREATEST syntax in the final lease definition", () => {
    expect(leaseFix).toContain("greatest(l.next_allowed_at,l.lease_expires_at)")
    expect(leaseFix).not.toContain("pg_catalog.greatest")
  })
  it("adds only provider-neutral document and fundamental reconciliation persistence", () => {
    expect(resilience).toContain("add column published_at timestamptz")
    expect(resilience).toContain("create table public.research_documents")
    expect(resilience).toContain("create table public.research_document_sources")
    expect(resilience).toContain("create table public.fundamental_reconciliation_cases")
    expect(resilience).toContain("create table public.fundamental_reconciliation_members")
    expect(resilience).not.toMatch(/trendlyne_|screener_/iu)
  })
})
