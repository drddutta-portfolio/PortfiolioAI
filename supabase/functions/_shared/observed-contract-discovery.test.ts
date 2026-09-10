import {readFile} from "node:fs/promises"
import {resolve} from "node:path"
import {describe,expect,it} from "vitest"

const sourcePath=resolve(process.cwd(),"supabase/functions/discover-trendlyne-observed-contract/index.ts")
const source=await readFile(sourcePath,"utf8")

describe("observed Trendlyne contract discovery boundary",()=>{
  it("reserves one unit before constructing the observed provider client",()=>{
    expect(source).toContain('const RESERVED_UNITS = 1')
    const reservation=source.indexOf('admin.rpc("reserve_provider_budget_v1"')
    const client=source.indexOf('new TrendlyneObservedMcpClient(mcpUrl)')
    expect(reservation).toBeGreaterThan(-1)
    expect(client).toBeGreaterThan(reservation)
  })

  it("makes exactly one observed structured-data tool call",()=>{
    expect(source).toContain('client.getParameterValuesMultiStock(query, "stock")')
    expect(source).toContain('provider_tool: "get_parameter_values_multi_stock"')
    expect(source).not.toContain('searchParameters(')
    expect(source).not.toContain('getParameterValues(')
  })

  it("records provider attempt accounting, settlement and bounded capture",()=>{
    expect(source).toContain('p_accounting_class: "PROVIDER_TOOL_ATTEMPT"')
    expect(source).toContain('p_operation_class: OPERATION_CLASS')
    expect(source).toContain('admin.rpc("settle_provider_budget_v1"')
    expect(source).toContain('const MAX_CAPTURE_BYTES = 512 * 1024')
    expect(source).toContain('const RECORD_KIND = "OBSERVED_CONTRACT_DISCOVERY_RESULT"')
    expect(source).toContain('.from("data_source_records").upsert')
  })

  it("keeps canonical research/fundamental writes disabled",()=>{
    expect(source).toContain('researchWritesPerformed: 0')
    expect(source).toContain('canonicalPromotionPerformed: false')
    expect(source).not.toContain('.from("fundamental_observations").insert')
    expect(source).not.toContain('.from("fundamental_observations").upsert')
    expect(source).not.toContain('.from("research_documents").insert')
    expect(source).not.toContain('.from("research_documents").upsert')
  })
})
