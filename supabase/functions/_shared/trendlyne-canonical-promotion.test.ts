import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"

const source = fs.readFileSync(path.resolve(process.cwd(), "supabase/functions/promote-trendlyne-observed-capture/index.ts"), "utf8")

describe("controlled Trendlyne canonical promotion source contract", () => {
  it("uses only captured evidence and makes no provider call", () => {
    expect(source).toContain('RECORD_KIND = "OBSERVED_CONTRACT_DISCOVERY_RESULT"')
    expect(source).toContain('providerCalls: 0')
    expect(source).not.toContain("TRENDLYNE_MCP_URL")
    expect(source).not.toContain("TrendlyneObservedMcpClient")
    expect(source).not.toContain("getParameterValuesMultiStock")
  })

  it("requires the exact four approved mappings and never invents period end", () => {
    expect(source).toContain('candidates.length !== 4')
    expect(source).toContain('"ROCE_ANNUAL", "EPS_DILUTED", "EBITDA_TTM", "OPM_TTM"')
    expect(source).toContain("period_end: null")
    expect(source).toContain('consolidation_scope: "UNKNOWN"')
  })

  it("links canonical observations back to immutable source evidence", () => {
    expect(source).toContain("source_record_id: body.sourceRecordId")
    expect(source).toContain("source_code: SOURCE_CODE")
    expect(source).toContain('evidence_status: "AVAILABLE"')
  })
})
