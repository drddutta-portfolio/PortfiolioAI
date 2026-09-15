import {describe,expect,it} from "vitest"
import {readFileSync} from "node:fs"

const root=process.cwd()
const edge=readFileSync(`${root}/supabase/functions/refresh-security-enrichment/index.ts`,"utf8")
const migration=readFileSync(`${root}/supabase/migrations_legacy/20260915_pre_r4n_baseline/20260909100000_create_stage7_2a_provider_control_plane.sql`,"utf8")

describe("Stage 7.2A provider control boundary",()=>{
  it("checks the kill switch before constructing the MCP client",()=>{
    expect(edge.indexOf('from("provider_ingestion_controls")')).toBeGreaterThan(-1)
    expect(edge.indexOf('PROVIDER_INGESTION_DISABLED')).toBeLessThan(edge.indexOf("new TrendlyneMcpClient"))
  })
  it("keeps control mutation and budget accounting service-only",()=>{
    expect(migration).toMatch(/revoke all on function public\.set_provider_ingestion_control_v1[\s\S]+from public,anon,authenticated/)
    expect(migration).toMatch(/grant execute on function public\.set_provider_ingestion_control_v1[\s\S]+to service_role/)
    expect(migration).not.toMatch(/grant (insert|update|delete).*provider_(ingestion_controls|usage_events|budget_reservations).*authenticated/i)
  })
  it("labels limits as internal and provider quota as unknown",()=>{
    expect(migration).toContain("PortfolioAI internal provider safety controls")
    expect(migration).toContain("actual_provider_quota_status text not null default 'UNKNOWN'")
  })
  it("does not schedule or call Trendlyne",()=>{
    expect(migration).not.toContain("pg_cron")
    expect(migration).not.toContain("TRENDLYNE_MCP_URL")
  })
})
