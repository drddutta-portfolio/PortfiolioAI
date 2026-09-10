import {readFile} from "node:fs/promises"
import {resolve} from "node:path"
import {describe,expect,it} from "vitest"

const sourcePath=resolve(process.cwd(),"supabase/functions/discover-trendlyne-capabilities/index.ts")
const source=await readFile(sourcePath,"utf8")

describe("Stage 7.2D.2B.3 Trendlyne MCP capability discovery boundary",()=>{
  it("reserves exactly one internal unit before external MCP transport",()=>{
    expect(source).toContain('const RESERVED_UNITS = 1')
    const reservation=source.indexOf('admin.rpc("reserve_provider_budget_v1"')
    const providerCall=source.indexOf('const result = await listTools(mcpUrl)')
    expect(reservation).toBeGreaterThan(-1)
    expect(providerCall).toBeGreaterThan(reservation)
  })

  it("uses MCP tools/list only and never invokes a provider tool",()=>{
    expect(source).toContain('method: "tools/list"')
    expect(source).not.toContain('method: "tools/call"')
    expect(source).not.toContain('get_parameter_values')
    expect(source).not.toContain('search_parameters')
  })

  it("records accounting and persists bounded capability evidence",()=>{
    expect(source).toContain('p_accounting_class: "TRANSPORT_BOOTSTRAP"')
    expect(source).toContain('p_operation_class: OPERATION_CLASS')
    expect(source).toContain('admin.rpc("settle_provider_budget_v1"')
    expect(source).toContain('const RECORD_KIND = "MCP_CAPABILITY_DISCOVERY"')
    expect(source).toContain('const MAX_CAPTURE_BYTES = 256 * 1024')
    expect(source).toContain('.from("data_source_records").upsert')
    expect(source).toContain('canonical_promotion_performed: false')
  })

  it("keeps canonical research evidence read-only",()=>{
    expect(source).not.toContain('.from("fundamental_observations").insert')
    expect(source).not.toContain('.from("fundamental_observations").upsert')
    expect(source).not.toContain('.from("research_documents").insert')
    expect(source).not.toContain('.from("research_documents").upsert')
  })
})
