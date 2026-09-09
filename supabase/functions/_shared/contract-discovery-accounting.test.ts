import {readFile} from "node:fs/promises"
import {describe,expect,it} from "vitest"

const sourceUrl=new URL("../discover-trendlyne-contract/index.ts",import.meta.url)
const source=await readFile(sourceUrl,"utf8")

describe("Stage 7.2D.2B.3 contract-discovery accounting boundary",()=>{
  it("reserves the exact four-call pilot before constructing the provider client",()=>{
    expect(source).toContain('const DISCOVERY_TERMS = ["ROCE", "diluted EPS", "EBITDA", "operating margin"] as const')
    expect(source).toContain('const RESERVED_UNITS = DISCOVERY_TERMS.length')
    const reservation=source.indexOf('admin.rpc("reserve_provider_budget_v1"')
    const clientConstruction=source.indexOf("new TrendlyneMcpClient(mcpUrl)")
    expect(reservation).toBeGreaterThan(-1)
    expect(clientConstruction).toBeGreaterThan(reservation)
  })

  it("records every physical search attempt and settles the reservation",()=>{
    expect(source).toContain('admin.rpc("record_provider_usage_event_v1"')
    expect(source).toContain('p_accounting_class: "PROVIDER_TOOL_ATTEMPT"')
    expect(source).toContain('p_operation_class: OPERATION_CLASS')
    expect(source).toContain('admin.rpc("settle_provider_budget_v1"')
    expect(source).toContain("p_consumed_units: consumedUnits")
    expect(source).toContain("p_failed_units: providerFailed")
    expect(source).toContain("p_released_units: releasedUnits")
  })

  it("keeps research evidence read-only while recording operational audit state",()=>{
    expect(source).toContain('data_domain: DATA_DOMAIN')
    expect(source).toContain('p_status: status')
    expect(source).toContain("researchWritesPerformed: 0")
    expect(source).not.toContain('.from("fundamental_observations").insert')
    expect(source).not.toContain('.from("fundamental_observations").upsert')
    expect(source).not.toContain('.from("research_documents").insert')
  })
})
