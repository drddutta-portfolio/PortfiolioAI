import {readFileSync} from "node:fs"
import {describe,expect,it} from "vitest"

const root=process.cwd()
const edge=readFileSync(`${root}/supabase/functions/refresh-security-enrichment/index.ts`,"utf8")
const migration=readFileSync(`${root}/supabase/migrations/20260908200000_enable_trusted_trendlyne_ingestion.sql`,"utf8")
const identitySchema=readFileSync(`${root}/supabase/migrations/20260908110000_create_stage7_provenance_and_security_identity.sql`,"utf8")
const observationSchema=readFileSync(`${root}/supabase/migrations/20260908111000_create_stage7_enrichment_observations.sql`,"utf8")

describe("trusted Trendlyne security and persistence boundary",()=>{
  it("authenticates before creating the service-role client",()=>expect(edge.indexOf("user.auth.getUser()")).toBeLessThan(edge.indexOf("const admin=createClient")))
  it("limits ingestion to ten open held equities",()=>{expect(edge).toContain("ids.length>10");expect(edge).toContain('from("current_holdings")');expect(edge).toContain('asset_class!=="EQUITY"')})
  it("keeps document discovery to a small subset",()=>expect(edge).toContain('action==="REFRESH_DOCUMENTS"&&ids.length>3'))
  it("does not return or log the provider endpoint",()=>{expect(edge).not.toMatch(/console\.|reply\([^\n]*mcpUrl/);expect(edge).not.toMatch(/TRENDLYNE_MCP_URL\s*[:=]\s*["'][^"']+["']/)})
  it("makes provider evidence idempotent",()=>{expect(identitySchema).toContain("data_source_records_dedup_key");expect(migration).toContain("research_document_sources_provider_appearance_key");expect(edge).toContain("ignoreDuplicates:true")})
  it("serializes provider refreshes with the trusted ingestion lease",()=>{expect(edge).toContain('acquire_data_ingestion_lease_v1');expect(edge).toContain('release_data_ingestion_lease_v1')})
  it("leaves browser evidence mutation denied",()=>{expect(identitySchema).toContain("revoke all on table public.data_sources");expect(observationSchema).toContain("revoke all on table public.classification_taxonomies")})
  it("does not touch accounting, transactions, holdings, roles, themes, or prices",()=>expect(migration).not.toMatch(/(?:insert into|update|delete from|alter table) public\.(transactions|current_holdings|broker_accounts|security_role|themes|market_prices)/i))
  it("records explicit owner approval without a browser activation path",()=>{expect(migration).toContain('"approved_by":"PORTFOLIO_OWNER"');expect(migration).not.toMatch(/grant .*data_sources.*authenticated/i)})
})
