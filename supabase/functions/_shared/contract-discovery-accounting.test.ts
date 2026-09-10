import {readFile} from "node:fs/promises"
import {resolve} from "node:path"
import {describe,expect,it} from "vitest"

const sourcePath=resolve(process.cwd(),"supabase/functions/discover-trendlyne-contract/index.ts")
const source=await readFile(sourcePath,"utf8")

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

  it("captures successful discovery output as bounded raw provider evidence",()=>{
    expect(source).toContain('const CAPTURE_RECORD_KIND = "CONTRACT_DISCOVERY_SEARCH_RESULT"')
    expect(source).toContain("const MAX_CAPTURE_BYTES = 512 * 1024")
    expect(source).toContain('.from("data_source_records").upsert')
    expect(source).toContain('run_id: runId')
    expect(source).toContain('external_record_id: `${providerInstrumentId}:contract-discovery:${CAPTURE_CONTRACT_VERSION}:${runId}`')
    expect(source).toContain('onConflict: "source_code,record_kind,external_record_id,payload_hash"')
    expect(source).toContain('ignoreDuplicates: true')
    expect(source).toContain('canonical_promotion_performed: false')
    expect(source).toContain('captureRecorded: true')
    const providerLoop=source.indexOf("for (const term of DISCOVERY_TERMS)")
    const captureCall=source.indexOf("capturePayloadHash = await persistDiscoveryCapture(")
    expect(providerLoop).toBeGreaterThan(-1)
    expect(captureCall).toBeGreaterThan(providerLoop)
  })

  it("keeps canonical research evidence read-only while recording operational audit state",()=>{
    expect(source).toContain('data_domain: DATA_DOMAIN')
    expect(source).toContain('p_status: status')
    expect(source).toContain("researchWritesPerformed: 0")
    expect(source).not.toContain('.from("fundamental_observations").insert')
    expect(source).not.toContain('.from("fundamental_observations").upsert')
    expect(source).not.toContain('.from("research_documents").insert')
    expect(source).not.toContain("getParameterValues(")
  })
})
