import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = readFileSync(resolve(process.cwd(), "supabase/functions/discover-trendlyne-bank-scoring-contract/index.ts"), "utf8")

describe("bank scoring contract discovery source boundaries", () => {
  it("is one-call HDFCBANK-only discovery", () => {
    expect(source).toContain('const RESERVED_UNITS = 1')
    expect(source).toContain('security.data.symbol !== "HDFCBANK"')
    expect(source).toContain('getParameterValuesMultiStock(query, "stock")')
    expect(source).toContain('providerCalls: 1')
  })

  it("reserves budget before constructing the provider client", () => {
    expect(source.indexOf('reserve_provider_budget_v1')).toBeLessThan(source.indexOf('new TrendlyneObservedMcpClient'))
  })

  it("captures raw evidence and does not promote or score", () => {
    expect(source).toContain('BANK_SCORING_CONTRACT_DISCOVERY')
    expect(source).toContain('canonical_promotion_performed: false')
    expect(source).toContain('research_writes_performed: 0')
    expect(source).not.toContain('.from("fundamental_observations").insert')
    expect(source).not.toContain('.from("stock_score_runs").insert')
  })

  it("records and settles exactly one provider attempt", () => {
    expect(source).toContain('PROVIDER_TOOL_ATTEMPT')
    expect(source).toContain('record_provider_usage_event_v1')
    expect(source).toContain('settle_provider_budget_v1')
  })
})
