import {describe,expect,it} from "vitest"
import source from "./index.ts?raw"

describe("p7-ic-benchmark-refresh V1-4 Batch B integration",()=>{
 it("requires retained master artifact before execution",()=>{
  expect(source).toContain("P7_IC_BENCHMARK_MASTER_ARTIFACT_REQUIRED")
  expect(source).toContain('record_kind",MASTER_KIND')
 })
 it("preflights all identities before history acquisition",()=>{
  expect(source.indexOf("preflightAllBenchmarkIdentities")).toBeLessThan(source.indexOf("getDailyHistory"))
  expect(source).toContain("P7_IC_BATCH_B_PREFLIGHT_NOT_ALL_EXACT")
 })
 it("increments request counters before provider requests and preserves them in failure output",()=>{
  expect(source).toContain("counters.instrumentMasterRequests+=1")
  expect(source).toContain('if(kind==="HISTORY")counters.attemptedHistoryRequests+=1')
  expect(source).toContain('if(kind==="AUTHENTICATE")counters.providerAuthenticationRequests+=1')
  expect(source).toContain("counters.successfulHistoryResponses+=1")
  expect(source).toContain("getDailyHistoryNoRetry")
  expect(source).toContain("counters.acceptedRows+=")
  expect(source).toContain("counters.persistedRows+=")
  expect(source).toContain("...actionCounters(counters)")
 })
 it("validates before benchmark history write",()=>{
  expect(source.indexOf("validateBatchBHistoryResponse")).toBeLessThan(source.indexOf('from("market_benchmark_price_history").upsert'))
 })
 it("enforces exact original order and fresh grant action",()=>{
  expect(source).toContain("exactOriginalBatchBOrder")
  expect(source).toContain("P7_IC2_EXECUTE_BATCH_B_V1")
  expect(source).toContain("EXECUTE_SENTINEL")
 })
 it("retains master integrity evidence",()=>{
  expect(source).toContain("payload_hash:hash")
  expect(source).toContain("source_url:MASTER_URL")
  expect(source).toContain("retrieved_at:completedAt")
  expect(source).toContain("P7_IC_BENCHMARK_MASTER_HASH_MISMATCH")
 })
})