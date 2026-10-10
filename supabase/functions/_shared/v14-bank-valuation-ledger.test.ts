import {describe,it,expect} from "vitest"
import {evaluateBankValuationLedger,BANK_VALUATION_LEDGER_RECORD_KIND,BANK_VALUATION_LEDGER_VERSION,type BankValuationLedgerRecord} from "./v14-bank-valuation-ledger.ts"
const H="a".repeat(64),SEC="be55b3cc-0400-45af-84aa-2a95e2c361c5"
function row(id:string,month:string,role:"CURRENT"|"HISTORICAL",multiple=2.5,published?:string,price?:string):BankValuationLedgerRecord{
 return{id,record_kind:BANK_VALUATION_LEDGER_RECORD_KIND,retrieved_at:"2026-10-10T00:00:00Z",raw_payload:{
  version:BANK_VALUATION_LEDGER_VERSION,security_id:SEC,requirement_code:"PB_RELATIVE",role,month,multiple,
  source_published_at:published??month+"-01T00:00:00Z",price_as_of:price??(role==="CURRENT"?"2026-10-09T10:00:00Z":month+"-28T10:00:00Z"),
  reporting_scope:"STANDALONE",corporate_action_basis:"SPLIT_BONUS_ALIGNED_PER_SHARE",
  source_hash:H,admitted:true,price_source_record_ids:["price-"+id],denominator_source_record_ids:["denom-"+id],
  corporate_action_source_record_ids:["ca-"+id]
 }}
}
const hist=Array.from({length:60},(_,i)=>{
 const d=new Date(Date.UTC(2021,9+i,1));return row("h"+i,d.toISOString().slice(0,7),"HISTORICAL")
})
describe("BANK V1-4 PIT valuation ledger adapter",()=>{
 it("passes the approved 36/60 comparator only with a unique current row",()=>{
  const r=evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-10T12:00:00Z",
   rows:[...hist,row("current","2026-10","CURRENT",2)]})
  expect(r.state).toBe("FRESH");expect(r.eligibleMonths).toBe(60);expect(r.ratio).toBeCloseTo(0.8)
 })
 it("fails closed without current PIT evidence",()=>{
  expect(evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-10T12:00:00Z",rows:hist}).reason)
   .toBe("BANK_VALUATION_CURRENT_PIT_MISSING")
 })
 it("rejects look-ahead current evidence",()=>{
  const bad=row("current","2026-10","CURRENT",2,"2026-10-11T00:00:00Z","2026-10-09T10:00:00Z")
  expect(evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-10T12:00:00Z",rows:[...hist,bad]}).reason)
   .toBe("BANK_VALUATION_CURRENT_LOOKAHEAD_OR_DATE_INVALID")
 })
 it("does not admit rows without underlying price, denominator and corporate-action lineage",()=>{
  const bad={...hist[0]!,raw_payload:{...hist[0]!.raw_payload,corporate_action_source_record_ids:[]}}
  const r=evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-10T12:00:00Z",
   rows:[bad,...hist.slice(1,35),row("current","2026-10","CURRENT",2)]})
  expect(r.state).toBe("REVIEW_REQUIRED");expect(r.reason).toBe("BANK_VALUATION_MIN_36_OF_60_MISSING")
 })
 it("rejects later-restatement look-ahead through sourcePublishedAt",()=>{
  const rows=hist.map((x,i)=>i===0?row("late","2021-10","HISTORICAL",2.5,"2026-01-01T00:00:00Z","2021-10-28T10:00:00Z"):x)
  const r=evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-10T12:00:00Z",
   rows:[...rows,row("current","2026-10","CURRENT",2)]})
  expect(r.eligibleMonths).toBe(59);expect(r.state).toBe("FRESH")
 })
})
