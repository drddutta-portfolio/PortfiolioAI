import {compareBankSelfHistory,positiveBankMultiple,type BankRelativeCode,type BankValuationObservation} from "./v14-bank-valuation-self-history.ts"
import {calculateBankPbMultiple,type BankPbCalculationInput} from "./v14-bank-valuation-pb-calculation.ts"
import {calculateBankPeMultiple,type BankPeCalculationInput} from "./v14-bank-valuation-pe-calculation.ts"
import {sameQualifiedHistoryNumeric} from "./v14-history-numeric-equality.ts"

export const BANK_VALUATION_LEDGER_VERSION="V1_4_BANK_VALUATION_PIT_LEDGER_V1"
export const BANK_VALUATION_LEDGER_RECORD_KIND="V1_4_BANK_VALUATION_PIT_OBSERVATION"
type Json=Readonly<Record<string,unknown>>
export interface BankValuationLedgerRecord{
 readonly id:string;readonly record_kind:string;readonly retrieved_at:string;readonly payload_hash?:string;readonly raw_payload:Json
}
export interface BankValuationLedgerEvaluation{
 readonly state:"REVIEW_REQUIRED"|"FRESH"
 readonly reason:string
 readonly eligibleMonths:number
 readonly ratio?:number
 readonly referenceMedian?:number
 readonly ratioExact?:string
 readonly referenceMedianExact?:string
 readonly currentRecordId?:string
 readonly historicalRecordIds:readonly string[]
 readonly lineage:Json
}
const ts=(v:unknown)=>typeof v==="string"?Date.parse(v):NaN
const session=(v:string)=>Number.isFinite(ts(v))?new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v)):""
const monthRe=/^\d{4}-(0[1-9]|1[0-2])$/
const hashRe=/^[0-9a-f]{64}$/i
const str=(p:Json,k:string)=>typeof p[k]==="string"?String(p[k]):""
const ids=(p:Json,k:string)=>Array.isArray(p[k])&&(p[k] as unknown[]).every(x=>typeof x==="string"&&String(x).length>0)?p[k] as string[]:null
function observation(row:BankValuationLedgerRecord,code:BankRelativeCode):BankValuationObservation|null{
 const p=row.raw_payload
 if(p.version!==BANK_VALUATION_LEDGER_VERSION||p.requirement_code!==code||p.admitted!==true)return null
 const multiple=typeof p.multiple==="string"?p.multiple:typeof p.multiple==="number"&&Number.isFinite(p.multiple)?String(p.multiple):"";
 const month=str(p,"month"),sourcePublishedAt=str(p,"source_published_at"),
  priceAsOf=str(p,"price_as_of"),reportingScope=str(p,"reporting_scope"),
  corporateActionBasis=str(p,"corporate_action_basis"),sourceHash=str(p,"source_hash")
 if(!monthRe.test(month)||!positiveBankMultiple(multiple)||!Number.isFinite(ts(sourcePublishedAt))||
   !Number.isFinite(ts(priceAsOf))||!reportingScope||!corporateActionBasis||!hashRe.test(sourceHash))return null
 if(!ids(p,"price_source_record_ids")?.length||!ids(p,"denominator_source_record_ids")?.length||
    !ids(p,"corporate_action_source_record_ids")?.length)return null
 if(p.pb_calculation_input!==undefined){
  if(code!=="PB_RELATIVE"||!p.pb_calculation_input||typeof p.pb_calculation_input!=="object"||Array.isArray(p.pb_calculation_input))return null
  const input=p.pb_calculation_input as unknown as BankPbCalculationInput
  const calculated=calculateBankPbMultiple(input)
  if(calculated.state!=="CALCULATED_NOT_ADMITTED"||str(p,"multiple")!==calculated.multiple||
     input.reportingScope!==reportingScope||ts(input.priceAsOf)!==ts(priceAsOf)||
     ts(calculated.sourceAvailableAt)!==ts(sourcePublishedAt))return null
 }
 if(p.pe_calculation_input!==undefined){
  if(code!=="PE_TTM_RELATIVE"||!p.pe_calculation_input||typeof p.pe_calculation_input!=="object"||Array.isArray(p.pe_calculation_input))return null
  const input=p.pe_calculation_input as unknown as BankPeCalculationInput
  const calculated=calculateBankPeMultiple(input)
  if(calculated.state!=="CALCULATED_NOT_ADMITTED"||str(p,"multiple")!==calculated.multiple||
     input.reportingScope!==reportingScope||ts(input.priceAsOf)!==ts(priceAsOf)||
     ts(calculated.sourceAvailableAt)!==ts(sourcePublishedAt))return null
 }
 return{month,multiple,sourcePublishedAt,priceAsOf,reportingScope,corporateActionBasis,sourceHash,admitted:true}
}
export function evaluateBankValuationLedger(input:{
 readonly code:BankRelativeCode;readonly securityId:string;readonly asOf:string;readonly rows:readonly BankValuationLedgerRecord[]
 readonly expectedPriceSession?:string;readonly expectedCurrentRawClose?:string
}):BankValuationLedgerEvaluation{
 const base={version:BANK_VALUATION_LEDGER_VERSION,securityId:input.securityId,code:input.code}
 const fail=(reason:string,eligibleMonths=0,historicalRecordIds:string[]=[]):BankValuationLedgerEvaluation=>({
  state:"REVIEW_REQUIRED",reason,eligibleMonths,historicalRecordIds,lineage:{...base}
 })
 const asOfMs=Date.parse(input.asOf);if(!Number.isFinite(asOfMs))return fail("BANK_VALUATION_LEDGER_ASOF_INVALID")
 const currentMonth=session(input.asOf).slice(0,7)
 const relevant=input.rows.filter(r=>r.record_kind===BANK_VALUATION_LEDGER_RECORD_KIND&&
   r.raw_payload.security_id===input.securityId&&r.raw_payload.requirement_code===input.code)
 const allCurrentRows=relevant.filter(r=>r.raw_payload.role==="CURRENT"&&r.raw_payload.month===currentMonth&&r.raw_payload.admitted===true)
 if(allCurrentRows.some(r=>!session(str(r.raw_payload,"price_as_of"))||ts(str(r.raw_payload,"price_as_of"))>asOfMs))
  return fail("BANK_VALUATION_CURRENT_LOOKAHEAD_OR_DATE_INVALID")
 const latestPriceSession=allCurrentRows.map(r=>session(str(r.raw_payload,"price_as_of"))).sort().at(-1)
 const currentRows=allCurrentRows.filter(r=>session(str(r.raw_payload,"price_as_of"))===latestPriceSession)
 const currentParsed=currentRows.map(r=>({row:r,o:observation(r,input.code)})).filter(x=>x.o) as Array<{row:BankValuationLedgerRecord;o:BankValuationObservation}>
 if(currentParsed.length!==1)return fail(currentParsed.length?"BANK_VALUATION_CURRENT_DUPLICATE_CONFLICT":"BANK_VALUATION_CURRENT_PIT_MISSING")
 const current=currentParsed[0]!,currentO=current.o
 if(input.expectedPriceSession&&session(currentO.priceAsOf)!==input.expectedPriceSession)
  return fail("BANK_VALUATION_CURRENT_PRICE_SESSION_NOT_LATEST_ELIGIBLE")
 if(input.expectedCurrentRawClose){
  const calculation=(input.code==="PB_RELATIVE"?current.row.raw_payload.pb_calculation_input:current.row.raw_payload.pe_calculation_input) as BankPbCalculationInput|BankPeCalculationInput|undefined
  if(!calculation||!sameQualifiedHistoryNumeric(calculation.rawClose,input.expectedCurrentRawClose))
   return fail("BANK_VALUATION_CURRENT_PRICE_SOURCE_CONFLICT")
 }
 if(ts(currentO.sourcePublishedAt)>ts(currentO.priceAsOf)||ts(currentO.priceAsOf)>asOfMs)
  return fail("BANK_VALUATION_CURRENT_LOOKAHEAD_OR_DATE_INVALID")
 const historical=relevant.filter(r=>r.raw_payload.role==="HISTORICAL").map(r=>({row:r,o:observation(r,input.code)})).filter(x=>x.o) as Array<{row:BankValuationLedgerRecord;o:BankValuationObservation}>
 const sameBasis=historical.filter(x=>x.o.reportingScope===currentO.reportingScope&&x.o.corporateActionBasis===currentO.corporateActionBasis&&session(x.o.priceAsOf).slice(0,7)===x.o.month)
 const result=compareBankSelfHistory({
  code:input.code,currentMultiple:currentO.multiple,currentMonth,currentScope:currentO.reportingScope,
  currentCorporateActionBasis:currentO.corporateActionBasis,asOf:input.asOf,historical:sameBasis.map(x=>x.o)
 })
 const historicalRecordIds=sameBasis.map(x=>x.row.id)
 return{
  ...result,currentRecordId:current.row.id,historicalRecordIds,
  lineage:{...base,currentRecordId:current.row.id,historicalRecordIds,currentMonth,
   reportingScope:currentO.reportingScope,corporateActionBasis:currentO.corporateActionBasis,
   currentSourceHash:currentO.sourceHash,comparator:"V1_4_BANK_SELF_HISTORY_36_OF_60_V1"}
 }
}
