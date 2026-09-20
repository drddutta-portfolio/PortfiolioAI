import { assert, assertEquals, assertFalse } from "jsr:@std/assert"

const source = await Deno.readTextFile(new URL("./index.ts", import.meta.url))

Deno.test("refresh-pharma-benchmark is restricted to TORNTPHARM and NIFTY Pharma", () => {
  assert(source.includes('const BENCHMARK_CODE = "NIFTY_PHARMA"'))
  assert(source.includes('const BENCHMARK_NAME = "NIFTY Pharma"'))
  assert(source.includes('security.data.symbol !== "TORNTPHARM"'))
  assert(source.includes('"NIFTY PHARMA", "NIFTYPHARMA", "CNXPHARMA"'))
  assertFalse(source.includes('security.data.symbol !== "HDFCBANK"'))
})

Deno.test("refresh-pharma-benchmark requires separate explicit owner confirmation", () => {
  assert(source.includes('const CONFIRMATION = "OWNER_CONFIRMED_PHARMA_BENCHMARK_REFRESH"'))
  assert(source.includes('body.confirmation !== CONFIRMATION'))
})

Deno.test("refresh-pharma-benchmark preserves deterministic relative-strength semantics", () => {
  assert(source.includes('"RELATIVE_STRENGTH_12M"'))
  assert(source.includes('stockReturn - benchmarkReturn'))
  assert(source.includes('common_start: derived.start'))
  assert(source.includes('common_end: derived.end'))
  assert(source.includes('benchmark_code: BENCHMARK_CODE'))
})

Deno.test("refresh-pharma-benchmark preserves provider-history safety controls", () => {
  assert(source.includes('p_operation: "REFRESH_HISTORY"'))
  assert(source.includes('const HISTORY_DAYS = 400'))
  assert(source.includes('const REQUIRED_INDEX_INSTRUMENT_TYPE = "AMXIDX"'))
  assert(source.includes('byToken.size !== 1'))
  assertEquals(source.includes('OWNER_CONFIRMED_BANK_BENCHMARK_REFRESH'), false)
})
