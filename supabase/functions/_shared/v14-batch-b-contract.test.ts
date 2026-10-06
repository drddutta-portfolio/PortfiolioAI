
import {describe,expect,it} from "vitest"
import {
  V1_4_BATCH_B_CODES,
  V1_4_BATCH_B_MAX_ROWS_PER_BENCHMARK,
  V1_4_BATCH_B_MAX_TOTAL_ROWS,
  batchBRequestWindow,
  emptyBatchBCounters,
  exactOriginalBatchBOrder,
  preflightBenchmarkIdentity,
  validateBatchBHistoryResponse,
} from "./v14-batch-b-contract"

const def=(aliases=["NIFTY CAPITAL GOODS"])=>({code:"NIFTY_CAPITAL_GOODS",displayName:"NIFTY Capital Goods",acceptedAliases:aliases,exchange:"NSE",instrumentType:"AMXIDX"})
const row=(patch={})=>({token:"999001",exch_seg:"NSE",symbol:"NIFTY CAPITAL GOODS",name:"NIFTY CAPITAL GOODS",instrumenttype:"AMXIDX",...patch})
const candles=(n=252,from="2025-09-01")=>{
 const start=Date.parse(from+"T00:00:00Z")
 const out=[]
 let d=0
 while(out.length<n){
  const date=new Date(start+d*86400000)
  const day=date.getUTCDay()
  if(day!==0&&day!==6)out.push({periodStart:date.toISOString(),open:"100",high:"102",low:"99",close:"101",volume:"1000",retrievedAt:"2026-10-06T08:00:00Z"})
  d++
 }
 return out
}
describe("V1-4 Batch B contract",()=>{
 it("freezes exact twelve-code order",()=>expect(exactOriginalBatchBOrder(V1_4_BATCH_B_CODES)).toBe(true))
 it("rejects reordered scope",()=>expect(exactOriginalBatchBOrder([...V1_4_BATCH_B_CODES].reverse())).toBe(false))
 it("resolves exact canonical identity",()=>expect(preflightBenchmarkIdentity(def(),[row()])).toMatchObject({status:"EXACT_MATCH",identity:{token:"999001",matchedAlias:"NIFTY CAPITAL GOODS"}}))
 it("allows only an explicitly accepted legitimate alias",()=>expect(preflightBenchmarkIdentity(def(["NIFTY CAPITAL GOODS","NIFTY CAP GOODS"]),[row({name:"NIFTY CAP GOODS",symbol:"NIFTY CAP GOODS"})])).toMatchObject({status:"EXACT_MATCH",identity:{matchedAlias:"NIFTY CAP GOODS"}}))
 it("fails ambiguous exact aliases",()=>expect(preflightBenchmarkIdentity(def(),[row(),row({token:"999002"})])).toMatchObject({status:"AMBIGUOUS",identity:null}))
 it("rejects wrong instrument type",()=>expect(preflightBenchmarkIdentity(def(),[row({instrumenttype:"OPTIDX"})])).toMatchObject({status:"UNAVAILABLE"}))
 it("rejects ETF substitution even when the name looks similar",()=>expect(preflightBenchmarkIdentity(def(),[row({token:"ETF1",instrumenttype:"AMXETF",symbol:"NIFTY CAPITAL GOODS ETF",name:"NIFTY CAPITAL GOODS"})])).toMatchObject({status:"UNAVAILABLE"}))
 it("fails missing identity while keeping similarity candidates non-authorizing",()=>{
  const x=preflightBenchmarkIdentity(def(),[row({token:"x",symbol:"CAPITAL GOODS INDEX",name:"CAPITAL GOODS INDEX"})])
  expect(x.status).toBe("UNAVAILABLE"); expect(x.identity).toBeNull(); expect(x.investigationCandidates[0]).toMatchObject({exactAliasAuthorized:false})
 })
 it("requires 252 distinct usable sessions",()=>expect(()=>validateBatchBHistoryResponse({candles:candles(251),requestFrom:"2025-09-01",requestTo:"2026-10-06",cutoffDate:"2026-10-06",alreadyAcceptedTotal:0})).toThrow("P7_IC_BENCHMARK_DISTINCT_SESSIONS_INSUFFICIENT"))
 it("rejects duplicate sessions",()=>{
  const c=candles(252); c.push({...c[0]})
  expect(()=>validateBatchBHistoryResponse({candles:c,requestFrom:"2025-09-01",requestTo:"2026-10-06",cutoffDate:"2026-10-06",alreadyAcceptedTotal:0})).toThrow("P7_IC_BENCHMARK_DUPLICATE_SESSION")
 })
 it("rejects candle outside exact request window",()=>{
  const c=candles(252); c[0]={...c[0],periodStart:"2025-08-29T00:00:00Z"}
  expect(()=>validateBatchBHistoryResponse({candles:c,requestFrom:"2025-09-01",requestTo:"2026-10-06",cutoffDate:"2026-10-06",alreadyAcceptedTotal:0})).toThrow("P7_IC_BENCHMARK_CANDLE_OUTSIDE_REQUEST_WINDOW")
 })
 it("rejects invalid OHLC values",()=>{
  const c=candles(252); c[0]={...c[0],high:"98"}
  expect(()=>validateBatchBHistoryResponse({candles:c,requestFrom:"2025-09-01",requestTo:"2026-10-06",cutoffDate:"2026-10-06",alreadyAcceptedTotal:0})).toThrow("P7_IC_BENCHMARK_OHLC_INCONSISTENT")
 })
 it("enforces 400-row per-benchmark ceiling",()=>{
  const c=candles(V1_4_BATCH_B_MAX_ROWS_PER_BENCHMARK+1)
  expect(()=>validateBatchBHistoryResponse({candles:c,requestFrom:"2025-09-01",requestTo:"2027-06-01",cutoffDate:"2027-06-01",alreadyAcceptedTotal:0})).toThrow("P7_IC_BENCHMARK_ROW_CEILING_EXCEEDED")
 })
 it("enforces 4,800 total accepted-row ceiling",()=>{
  expect(()=>validateBatchBHistoryResponse({candles:candles(252),requestFrom:"2025-09-01",requestTo:"2026-10-06",cutoffDate:"2026-10-06",alreadyAcceptedTotal:V1_4_BATCH_B_MAX_TOTAL_ROWS-251})).toThrow("P7_IC_BENCHMARK_TOTAL_ROW_CEILING_EXCEEDED")
 })
 it("builds exact 400-day request window",()=>expect(batchBRequestWindow("2026-10-06")).toEqual({requestFrom:"2025-09-01",requestTo:"2026-10-06",cutoffDate:"2026-10-06"}))
 it("keeps independent counters",()=>{
  const c=emptyBatchBCounters();c.instrumentMasterRequests++;c.successfulInstrumentMasterResponses++;c.providerAuthenticationRequests++;c.successfulAuthenticationResponses++;c.attemptedHistoryRequests++;c.successfulHistoryResponses++;c.acceptedRows+=252;c.persistedRows+=252
  expect(c).toEqual({instrumentMasterRequests:1,successfulInstrumentMasterResponses:1,providerAuthenticationRequests:1,successfulAuthenticationResponses:1,attemptedHistoryRequests:1,successfulHistoryResponses:1,acceptedRows:252,persistedRows:252})
 })
})