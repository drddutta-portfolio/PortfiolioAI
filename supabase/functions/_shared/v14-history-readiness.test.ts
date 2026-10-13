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
 it("carries a verified post-close session across a current CLOSED NSE date",()=>{
  const p=proof("PRICE_RETURN_CORPORATE_ACTION_ADJUSTED",{freshnessThrough:"2026-10-09T13:30:00Z",dailySessionState:"LATEST_COMPLETED_SESSION_POST_CLOSE",dailySessionProofRecordIds:["daily-proof"]})
  const history:HistoryRow[]=[
   {period_start:"2026-10-08T00:00:00+05:30",retrieved_at:"2026-10-09T14:00:00Z",close:"100",adjusted_close:"100",provenance:{v1_4_history_contract:p}},
   {period_start:"2026-10-09T00:00:00+05:30",retrieved_at:"2026-10-09T14:00:00Z",close:"101",adjusted_close:"101",provenance:{v1_4_history_contract:p}},
  ]
  const x=validateStockHistoryReadiness({rows:history,minimum:2,evaluationAsOfMs:Date.parse("2026-10-10T14:30:00Z"),sourceCutoffAtMs:Date.parse("2026-10-10T14:30:00Z"),freshnessPolicy:"MARKET_5_TRADING_DAYS",proof:p,currentSessionDecision:{sessionDate:"2026-10-10",decision:"CLOSED",recordId:"calendar-decision",reason:"WEEKEND_NO_APPROVED_SPECIAL_SESSION"}})
  expect(x).toMatchObject({state:"FRESH",reason:"STOCK_HISTORY_CONTRACT_READY"})
  expect(x.lineage).toMatchObject({currentSessionDecisionRecordId:"calendar-decision",currentSessionDecision:"CLOSED"})
 })
 it("does not carry stale history across OPEN UNKNOWN or missing session decisions",()=>{
  const p=proof("PRICE_RETURN_CORPORATE_ACTION_ADJUSTED",{freshnessThrough:"2026-10-09T13:30:00Z",dailySessionState:"LATEST_COMPLETED_SESSION_POST_CLOSE",dailySessionProofRecordIds:["daily-proof"]})
  const history:HistoryRow[]=[
   {period_start:"2026-10-08T00:00:00+05:30",retrieved_at:"2026-10-09T14:00:00Z",close:"100",adjusted_close:"100",provenance:{v1_4_history_contract:p}},
   {period_start:"2026-10-09T00:00:00+05:30",retrieved_at:"2026-10-09T14:00:00Z",close:"101",adjusted_close:"101",provenance:{v1_4_history_contract:p}},
  ]
  const base={rows:history,minimum:2,evaluationAsOfMs:Date.parse("2026-10-10T14:30:00Z"),sourceCutoffAtMs:Date.parse("2026-10-10T14:30:00Z"),freshnessPolicy:"MARKET_5_TRADING_DAYS",proof:p}
  expect(validateStockHistoryReadiness({...base,currentSessionDecision:{sessionDate:"2026-10-10",decision:"OPEN",recordId:"open-decision",reason:"OPEN"}})).toMatchObject({state:"STALE",reason:"HISTORY_LATEST_SESSION_STALE"})
  expect(validateStockHistoryReadiness({...base,currentSessionDecision:{sessionDate:"2026-10-10",decision:"UNKNOWN",recordId:"unknown-decision",reason:"SPECIAL_PENDING"}})).toMatchObject({state:"STALE",reason:"HISTORY_LATEST_SESSION_STALE"})
  expect(validateStockHistoryReadiness(base)).toMatchObject({state:"STALE",reason:"HISTORY_LATEST_SESSION_STALE"})
 })
 it("uses verified latest-completed-session evidence before Monday pre-open, then expires it",()=>{
  const p=proof("PRICE_RETURN_CORPORATE_ACTION_ADJUSTED",{freshnessThrough:"2026-10-10T08:25:19.805Z",dailySessionState:"LATEST_COMPLETED_SESSION_POST_CLOSE",dailySessionProofRecordIds:["friday-proof"]})
  const history:HistoryRow[]=[{period_start:"2026-10-08T00:00:00+05:30",retrieved_at:"2026-10-10T08:00:00Z",close:"100",adjusted_close:"100",provenance:{source_record_id:"friday-source"}},{period_start:"2026-10-09T00:00:00+05:30",retrieved_at:"2026-10-10T08:00:00Z",close:"101",adjusted_close:"101",provenance:{source_record_id:"friday-source"}}]
  const decision={sessionDate:"2026-10-12",decision:"UNKNOWN" as const,recordId:"",reason:"PRE_OPEN_LATEST_COMPLETED_SESSION_VERIFIED",preOpenCalendar:{latestCompletedSession:"2026-10-09",sourceRecordIds:["base","baseline","live"],verifiedAt:"2026-10-11T18:52:00Z",validBefore:"2026-10-12T09:00:00+05:30"}}
  const base={rows:history,minimum:2,evaluationAsOfMs:Date.parse("2026-10-11T18:52:00Z"),sourceCutoffAtMs:Date.parse("2026-10-11T18:52:00Z"),freshnessPolicy:"MARKET_5_TRADING_DAYS",proof:p,currentSessionDecision:decision}
  expect(validateStockHistoryReadiness(base)).toMatchObject({state:"FRESH"})
  expect(validateStockHistoryReadiness({...base,evaluationAsOfMs:Date.parse("2026-10-12T03:30:00Z")})).toMatchObject({state:"STALE"})
  expect(validateStockHistoryReadiness({...base,currentSessionDecision:{...decision,reason:"SPECIAL_PENDING"}})).toMatchObject({state:"STALE"})
  expect(validateStockHistoryReadiness({...base,rows:history.slice(0,1),minimum:1})).toMatchObject({state:"STALE"})
  expect(validateStockHistoryReadiness({...base,proof:{...p,dailySessionState:"LATEST_COMPLETED_SESSION_PRE_CLOSE"}})).toMatchObject({state:"STALE"})
  expect(validateStockHistoryReadiness({...base,proof:{...p,freshnessThrough:"2026-10-01T14:00:00Z"}})).toMatchObject({state:"STALE"})
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
