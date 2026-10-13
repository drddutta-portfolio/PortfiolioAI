import {describe,it,expect} from "vitest"
import {evaluateBankValuationLedger,BANK_VALUATION_LEDGER_RECORD_KIND,BANK_VALUATION_LEDGER_VERSION,type BankValuationLedgerRecord} from "./v14-bank-valuation-ledger.ts"
import type {BankPbCalculationInput} from "./v14-bank-valuation-pb-calculation.ts"
import {calculateBankPeMultiple,type BankPeCalculationInput} from "./v14-bank-valuation-pe-calculation.ts"
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
 it("binds P/E to four source quarters and the current price rather than a cached multiple",()=>{
  const input:BankPeCalculationInput={rawClose:"342.30",currency:"INR",priceBasis:"RAW_CONTEMPORANEOUS_CLOSE",reportingScope:"STANDALONE",
   ttmPeriodEnd:"2026-06-30",priceAsOf:"2026-10-09T10:00:00Z",evaluationAsOf:"2026-10-10T12:00:00Z",
   quarters:["2025-09-30","2025-12-31","2026-03-31","2026-06-30"].map((end,i)=>({quarterStart:["2025-07-01","2025-10-01","2026-01-01","2026-04-01"][i]!,quarterEnd:end,dilutedEps:["5.94","7.14","7.50","7.82"][i]!,epsBasis:"DILUTED_NONANNUALIZED_QUARTER",unit:"INR_PER_SHARE",reportingScope:"STANDALONE",originalSha256:H,sourceAvailableAt:"2026-07-20T10:00:00Z",denominatorShareFactorNumerator:"1",denominatorShareFactorDenominator:"1",shareBasisAvailableAt:"2026-07-20T10:00:00Z",shareAlignment:"SOURCE_QUALIFIED"}))}
  const calc=calculateBankPeMultiple(input);if(calc.state!=="CALCULATED_NOT_ADMITTED")throw Error(calc.reason)
  const current=row("pe-current","2026-10","CURRENT",2,calc.sourceAvailableAt)
  const candidate={...current,raw_payload:{...current.raw_payload,requirement_code:"PE_TTM_RELATIVE",multiple:calc.multiple,pe_calculation_input:input}}
  const rows=[...hist.map(r=>({...r,raw_payload:{...r.raw_payload,requirement_code:"PE_TTM_RELATIVE"}})),candidate]
  const evaluate=(values:BankValuationLedgerRecord[],close="342.30")=>evaluateBankValuationLedger({code:"PE_TTM_RELATIVE",securityId:SEC,asOf:input.evaluationAsOf,rows:values,expectedCurrentRawClose:close})
  expect(evaluate(rows).state).toBe("FRESH")
  expect(evaluate(rows,"343.00").reason).toBe("BANK_VALUATION_CURRENT_PRICE_SOURCE_CONFLICT")
  expect(evaluate([...rows.slice(0,-1),{...candidate,raw_payload:{...candidate.raw_payload,multiple:"8.0000000000000000"}}]).state).toBe("REVIEW_REQUIRED")
  expect(evaluate([...rows.slice(0,-1),{...candidate,raw_payload:{...candidate.raw_payload,pe_calculation_input:{...input,quarters:input.quarters.slice(1)}}}]).state).toBe("REVIEW_REQUIRED")
 })
 it("recalculates supplied book inputs rather than trusting a stored multiple",()=>{
  const input:BankPbCalculationInput={rawClose:"200",capital:"2",reservesAndSurplus:"98",currency:"INR",amountScale:"INR",
   fullyPaidShares:"1",equityPeriodEnd:"2026-03-31",sharesPeriodEnd:"2026-03-31",reportingScope:"STANDALONE",
   shareCountBasis:"FULLY_PAID_OUTSTANDING",bookBasis:"STATUTORY_COMMON_EQUITY",priceBasis:"RAW_CONTEMPORANEOUS_CLOSE",
   equityAvailableAt:"2026-05-07T10:00:00Z",sharesAvailableAt:"2026-06-30T10:00:00Z",priceAsOf:"2026-10-09T10:00:00Z",
   evaluationAsOf:"2026-10-10T12:00:00Z",denominatorShareFactorNumerator:"1",denominatorShareFactorDenominator:"1",shareAlignment:"SOURCE_QUALIFIED"}
  const current=row("current","2026-10","CURRENT",2,"2026-06-30T10:00:00Z")
  const qualified={...current,raw_payload:{...current.raw_payload,multiple:"2.0000000000000000",pb_calculation_input:input}}
  const evaluate=(candidate:BankValuationLedgerRecord)=>evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:input.evaluationAsOf,rows:[...hist,candidate]})
  expect(evaluate(qualified).state).toBe("FRESH")
  expect(evaluate({...qualified,raw_payload:{...qualified.raw_payload,multiple:"3.0000000000000000"}}).state).toBe("REVIEW_REQUIRED")
  expect(evaluate({...qualified,raw_payload:{...qualified.raw_payload,pb_calculation_input:{...input,sharesAvailableAt:"2026-11-01T00:00:00Z"}}}).state).toBe("REVIEW_REQUIRED")
 })
 it("passes the approved 36/60 comparator only with a unique current row",()=>{
  const r=evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-10T12:00:00Z",
   rows:[...hist,row("current","2026-10","CURRENT",2)]})
  expect(r.state).toBe("FRESH");expect(r.eligibleMonths).toBe(60);expect(r.ratio).toBeCloseTo(0.8)
 })
 it("fails closed without current PIT evidence",()=>{
  expect(evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-10T12:00:00Z",rows:hist}).reason)
   .toBe("BANK_VALUATION_CURRENT_PIT_MISSING")
 })
 it("selects the latest actual market session while retaining earlier current records",()=>{
  const earlier=row("earlier","2026-10","CURRENT",1.5,"2026-09-01T00:00:00Z","2026-10-08T10:00:00Z")
  const latest=row("latest","2026-10","CURRENT",2,"2026-09-01T00:00:00Z","2026-10-09T10:00:00Z")
  const r=evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-10T12:00:00Z",rows:[...hist,earlier,latest],expectedPriceSession:"2026-10-09"})
  expect(r.state).toBe("FRESH");expect(r.currentRecordId).toBe("latest")
  expect(evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-12T15:00:00Z",rows:[...hist,latest],expectedPriceSession:"2026-10-12"}).reason)
   .toBe("BANK_VALUATION_CURRENT_PRICE_SESSION_NOT_LATEST_ELIGIBLE")
  expect(evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:SEC,asOf:"2026-10-10T12:00:00Z",rows:[...hist,latest,{...latest,id:"conflicting"}]}).reason)
   .toBe("BANK_VALUATION_CURRENT_DUPLICATE_CONFLICT")
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
