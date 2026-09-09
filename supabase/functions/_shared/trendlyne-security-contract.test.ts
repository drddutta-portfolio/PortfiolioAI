import {readFileSync} from "node:fs"
import {describe,expect,it} from "vitest"

const root=process.cwd()
const edge=readFileSync(`${root}/supabase/functions/refresh-security-enrichment/index.ts`,"utf8")
const migration=readFileSync(`${root}/supabase/migrations/20260908200000_enable_trusted_trendlyne_ingestion.sql`,"utf8")
const identitySchema=readFileSync(`${root}/supabase/migrations/20260908110000_create_stage7_provenance_and_security_identity.sql`,"utf8")
const observationSchema=readFileSync(`${root}/supabase/migrations/20260908111000_create_stage7_enrichment_observations.sql`,"utf8")

describe("trusted Trendlyne security and persistence boundary",()=>{
  it("authenticates before creating the service-role client",()=>expect(edge.indexOf("user.auth.getUser()")).toBeLessThan(edge.indexOf("const admin=createClient")))
  it("accepts only the exact approved cohort of twenty-five open held equities",()=>{expect(edge).toContain("isApprovedCohortA");expect(edge).toContain("ids.length!==25");expect(edge).toContain('from("current_holdings")');expect(edge).toContain('asset_class!=="EQUITY"')})
  it("keeps document discovery to a small subset",()=>expect(edge).toContain("documentIds.length>3"))
  it("invokes the shared hardened planner and executor",()=>{expect(edge).toContain("planCohort(states");expect(edge).toContain("executePlannedBatch(batch");expect(edge).not.toContain("rows.length*4")})
  it("has no parallel legacy provider execution path",()=>{expect(edge).toContain("LEGACY_REFRESH_RETIRED");expect(edge.match(/new TrendlyneMcpClient/g)).toHaveLength(1)})
  it("requires one explicit sequenced logical batch for live execution",()=>{expect(edge).toContain("INVALID_BATCH_SELECTION");expect(edge).toContain("BATCH_SEQUENCE_INVALID");expect(edge).toContain("waveOneFresh");expect(edge).toContain("for(const batch of [selectedBatch])")})
  it("returns from dry-run before client construction or reservation",()=>{const dryRun=edge.indexOf('if(body.dryRun===true)return reply(200');expect(dryRun).toBeGreaterThan(-1);expect(dryRun).toBeLessThan(edge.indexOf("new TrendlyneMcpClient"));expect(edge.slice(0,dryRun)).not.toContain("reserve_provider_budget_v1");expect(edge).toContain("providerCalls:0,budgetConsumed:0")})
  it("does not return or log the provider endpoint",()=>{expect(edge).not.toMatch(/console\.|reply\([^\n]*mcpUrl/);expect(edge).not.toMatch(/TRENDLYNE_MCP_URL\s*[:=]\s*["'][^"']+["']/)})
  it("makes provider evidence idempotent",()=>{expect(identitySchema).toContain("data_source_records_dedup_key");expect(migration).toContain("research_document_sources_provider_appearance_key");expect(edge).toContain("ignoreDuplicates:true")})
  it("serializes provider refreshes with the trusted ingestion lease",()=>{expect(edge).toContain('acquire_data_ingestion_lease_v1');expect(edge).toContain('release_data_ingestion_lease_v1')})
  it("leaves browser evidence mutation denied",()=>{expect(identitySchema).toContain("revoke all on table public.data_sources");expect(observationSchema).toContain("revoke all on table public.classification_taxonomies")})
  it("does not touch accounting, transactions, holdings, roles, themes, or prices",()=>expect(migration).not.toMatch(/(?:insert into|update|delete from|alter table) public\.(transactions|current_holdings|broker_accounts|security_role|themes|market_prices)/i))
  it("records explicit owner approval without a browser activation path",()=>{expect(migration).toContain('"approved_by":"PORTFOLIO_OWNER"');expect(migration).not.toMatch(/grant .*data_sources.*authenticated/i)})
})
