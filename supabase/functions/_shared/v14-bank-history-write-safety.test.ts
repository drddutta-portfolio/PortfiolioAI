import { describe, expect, it } from "vitest"
import stockSource from "../refresh-market-history/index.ts?raw"
import benchmarkSource from "../refresh-bank-benchmark/index.ts?raw"

describe("V1-4 banking history retention safety", () => {
  it("never silently upserts over an existing stock OHLCV session", () => {
    expect(stockSource).toContain("HISTORY_CORRECTION_REQUIRES_REVIEW")
    expect(stockSource).toContain("ignoreDuplicates: true")
    expect(stockSource).toContain('select("period_start,open,high,low,close,volume")')
    expect(stockSource).toContain('eq("security_id", security.id)')
  })
  it("never silently upserts over an existing NIFTY_BANK OHLCV session", () => {
    expect(benchmarkSource).toContain("BENCHMARK_CORRECTION_REQUIRES_REVIEW")
    expect(benchmarkSource).toContain("ignoreDuplicates: true")
    expect(benchmarkSource).toContain('select("period_start,open,high,low,close,volume")')
    expect(benchmarkSource).toContain('eq("benchmark_code", BENCHMARK_CODE)')
  })
})
