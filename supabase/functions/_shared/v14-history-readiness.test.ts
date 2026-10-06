import {describe,expect,it} from "vitest"
import {validateStockHistoryReadiness,validateBenchmarkPairReadiness,type HistoryContractProof} from "./v14-history-readiness.ts"
import type {HistoryRow} from "./p7-ic-input-validation.ts"

const day=86400000, start=Date.parse("2025-10-01T00:00:00Z")
const proof=(basis:HistoryContractProof["returnBasis"]="PRICE_RETURN_RAW_CLOSE",patch:Partial<HistoryContractProof>={}):HistoryContractProof=>({
 version:"V1_4_HISTORY_CONTRACT_V1",sourceAuthority:"ANGEL_ONE",exchangeCalendarState:"VERIFIED",exchangeCalendarSourceRecordIds:["calendar"],
 corporateActionState:"COMPLETE",corporateActionSourceRecordIds:["actions"],unresolvedCorporateActionCount:0,returnBasis:basis,
 freshnessThrough:"2026-10-10T00:00:00Z",lineageSourceRecordIds:["history-source"],...patch,
})
function rows(n=252,p:HistoryContractProof=proof()):HistoryRow[]{
 return Array.from({length:n},(_,i)=>({period_start:new Date(start+i*day).toISOString(),retrieved_at:"2026-10-05T12:00:00Z",close:String(100+i/10),adjusted_close:null,provenance:{v1_4_history_contract:p}}))
}
const evaluationAsOfMs=Date.parse("2026-10-06T00:00:00Z"),sourceCutoffAtMs=Date.parse("2026-10-06T00:00:00Z")
describe("V1-4 deterministic history readiness",()=>{
 it("qualifies stock history only with explicit complete contract proof",()=>{
  const x=validateStockHistoryReadiness({rows:rows(),minimum:252,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:"MARKET_5_TRADING_DAYS"})
  expect(x).toMatchObject({state:"FRESH",reason:"STOCK_HISTORY_CONTRACT_READY",returnBasis:"PRICE_RETURN_RAW_CLOSE"})
  expect(x.selectedSessions).toHaveLength(252)
 })
 it("does not convert raw close into adjusted close",()=>{
  const x=validateStockHistoryReadiness({rows:rows(),minimum:252,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:"MARKET_5_TRADING_DAYS"})
  expect(x.returnBasis).toBe("PRICE_RETURN_RAW_CLOSE")
 })
 it("blocks missing corporate-action treatment and calendar proof",()=>{
  expect(validateStockHistoryReadiness({rows:rows(),minimum:252,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:"MARKET_5_TRADING_DAYS",proof:proof("PRICE_RETURN_RAW_CLOSE",{corporateActionState:"INCOMPLETE",unresolvedCorporateActionCount:1})})).toMatchObject({state:"REVIEW_REQUIRED",reason:"CORPORATE_ACTION_TREATMENT_NOT_PROVEN"})
  expect(validateStockHistoryReadiness({rows:rows(),minimum:252,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:"MARKET_5_TRADING_DAYS",proof:proof("PRICE_RETURN_RAW_CLOSE",{exchangeCalendarState:"UNVERIFIED"})})).toMatchObject({state:"REVIEW_REQUIRED",reason:"EXCHANGE_CALENDAR_NOT_PROVEN"})
 })
 it("fails stale latest-history contract",()=>{
  expect(validateStockHistoryReadiness({rows:rows(),minimum:252,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:"MARKET_5_TRADING_DAYS",proof:proof("PRICE_RETURN_RAW_CLOSE",{freshnessThrough:"2026-10-05T00:00:00Z"})})).toMatchObject({state:"STALE",reason:"HISTORY_LATEST_SESSION_STALE"})
 })
 it("qualifies aligned benchmark pair with exact mapping",()=>{
  const stock=rows(),benchmark=rows(252,proof("PRICE_RETURN_RAW_CLOSE",{lineageSourceRecordIds:["bench"]}))
  const x=validateBenchmarkPairReadiness({stockRows:stock,benchmarkRows:benchmark,minimum:252,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:"MARKET_5_TRADING_DAYS",
    benchmark:{code:"NIFTY_500",mapping_status:"VERIFIED",provider_code:"ANGEL_ONE",provider_instrument_id:"99926004",verified_at:"2026-09-29T00:00:00Z"}})
  expect(x).toMatchObject({state:"FRESH",reason:"STOCK_BENCHMARK_HISTORY_READY"})
 })
 it("blocks benchmark calendar misalignment",()=>{
  const stock=rows(),benchmark=rows().map((r,i)=>i===251?{...r,period_start:new Date(start+253*day).toISOString()}:r)
  const x=validateBenchmarkPairReadiness({stockRows:stock,benchmarkRows:benchmark,minimum:252,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:"MARKET_5_TRADING_DAYS",
    benchmark:{code:"NIFTY_500",mapping_status:"VERIFIED",provider_code:"ANGEL_ONE",provider_instrument_id:"99926004",verified_at:"2026-09-29T00:00:00Z"}})
  expect(x).toMatchObject({state:"REVIEW_REQUIRED",reason:"STOCK_BENCHMARK_SESSION_ALIGNMENT_NOT_PROVEN"})
 })
 it("blocks incompatible stock adjusted-price versus benchmark total-return semantics",()=>{
  const stock=rows(252,proof("PRICE_RETURN_CORPORATE_ACTION_ADJUSTED")),benchmark=rows(252,proof("TOTAL_RETURN_INDEX"))
  const x=validateBenchmarkPairReadiness({stockRows:stock,benchmarkRows:benchmark,minimum:252,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:"MARKET_5_TRADING_DAYS",
    benchmark:{code:"NIFTY_500",mapping_status:"VERIFIED",provider_code:"ANGEL_ONE",provider_instrument_id:"99926004",verified_at:"2026-09-29T00:00:00Z"}})
  expect(x).toMatchObject({state:"REVIEW_REQUIRED",reason:"STOCK_BENCHMARK_RETURN_BASIS_MISMATCH"})
 })
})