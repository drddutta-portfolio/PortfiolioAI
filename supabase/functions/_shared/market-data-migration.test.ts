// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sql = readFileSync(new URL("../../migrations/20260907120000_create_market_data_foundation.sql", import.meta.url), "utf8")
const leaseFixSql = readFileSync(new URL("../../migrations/20260907123000_fix_market_data_lease_retry_after.sql", import.meta.url), "utf8")

describe("Stage 4 migration security contract", () => {
  it("rejects a mapping id paired with the wrong security/provider", () => {
    expect(sql).toContain("foreign key (mapping_id, security_id, provider_code)")
    expect(sql.match(/foreign key \(mapping_id, security_id, provider_code\)/gu)).toHaveLength(3)
    expect(sql).toContain("references public.market_data_instrument_mappings (id, security_id, provider_code)")
  })

  it("uses atomic database-backed acquisition and enforces lease/cooldown gates", () => {
    expect(sql).toContain("primary key (provider_code, operation)")
    expect(sql).toContain("on conflict (provider_code, operation) do update")
    expect(sql).toContain("lease_expires_at <= pg_catalog.clock_timestamp()")
    expect(sql).toContain("next_allowed_at <= pg_catalog.clock_timestamp()")
    expect(sql).toContain("and lease_holder = p_lease_holder")
  })

  it("uses valid unqualified PostgreSQL GREATEST syntax in the recovery definition", () => {
    expect(leaseFixSql).toContain("greatest(leases.next_allowed_at, leases.lease_expires_at)")
    expect(leaseFixSql).not.toContain("pg_catalog.greatest")
  })

  it("denies browser lease access and function execution", () => {
    expect(sql).toContain("revoke all privileges on table public.market_data_operation_leases from anon, authenticated")
    expect(sql).toContain("revoke all on function public.acquire_market_data_operation_lease(uuid, text, text, uuid, integer) from public, anon, authenticated")
    expect(sql).toContain("grant execute on function public.acquire_market_data_operation_lease(uuid, text, text, uuid, integer) to service_role")
  })

  it("provides an auditable pending review instead of overwriting verified identity", () => {
    expect(sql).toContain("create table public.market_data_mapping_reviews")
    expect(sql).toContain("review_status text not null default 'PENDING'")
    expect(sql).toContain("market_data_mapping_review_status_key unique (mapping_id, review_status)")
  })
})
