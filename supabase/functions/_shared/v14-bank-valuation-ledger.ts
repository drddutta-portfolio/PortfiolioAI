import {compareBankSelfHistory,type BankRelativeCode,type BankValuationObservation} from "./v14-bank-valuation-self-history.ts"

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
 readonly currentRecordId?:string
 readonly historicalRecordIds:readonly string[]
 readonly lineage:Json
}
const ts=(v:unknown)=>typeof v==="string"?Date.parse(v):NaN
const monthRe=/^\d{4}-(0[1-9]|1[0-2])$/
const hashRe=/^[0-9a-f]{64}$/i
const str=(p:Json,k:string)=>typeof p[k]==="string"?String(p[k]):""
const ids=(p:Json,k:string)=>Array.isArray(p[k])&&(p[k] as unknown[]).every(x=>typeof x==="string"&&String(x).length>0)?p[k] as string[]:null
function observation(row:BankValuationLedgerRecord,code:BankRelativeCode):BankValuationObservation|null{
 const p=row.raw_payload
 if(p.version!==BANK_VALUATION_LEDGER_VERSION||p.requirement_code!==code||p.admitted!==true)return null
 const month=str(p,"month"),multiple=Number(p.multiple),sourcePublishedAt=str(p,"source_published_at"),
  priceAsOf=str(p,"price_as_of"),reportingScope=str(p,"reporting_scope"),
  corporateActionBasis=str(p,"corporate_action_basis"),sourceHash=str(p,"source_hash")
 if(!monthRe.test(month)||!Number.isFinite(multiple)||multiple<=0||!Number.isFinite(ts(sourcePublishedAt))||
   !Number.isFinite(ts(priceAsOf))||!reportingScope||!corporateActionBasis||!hashRe.test(sourceHash))return null
 if(!ids(p,"price_source_record_ids")?.length||!ids(p,"denominator_source_record_ids")?.length||
    !ids(p,"corporate_action_source_record_ids")?.length)return null
 return{month,multiple,sourcePublishedAt,priceAsOf,reportingScope,corporateActionBasis,sourceHash,admitted:true}
}
export function evaluateBankValuationLedger(input:{
 readonly code:BankRelativeCode;readonly securityId:string;readonly asOf:string;readonly rows:readonly BankValuationLedgerRecord[]
}):BankValuationLedgerEvaluation{
 const base={version:BANK_VALUATION_LEDGER_VERSION,securityId:input.securityId,code:input.code}
 const fail=(reason:string,eligibleMonths=0,historicalRecordIds:string[]=[]):BankValuationLedgerEvaluation=>({
  state:"REVIEW_REQUIRED",reason,eligibleMonths,historicalRecordIds,lineage:{...base}
 })
 const asOfMs=Date.parse(input.asOf);if(!Number.isFinite(asOfMs))return fail("BANK_VALUATION_LEDGER_ASOF_INVALID")
 const currentMonth=input.asOf.slice(0,7)
 const relevant=input.rows.filter(r=>r.record_kind===BANK_VALUATION_LEDGER_RECORD_KIND&&
   r.raw_payload.security_id===input.securityId&&r.raw_payload.requirement_code===input.code)
 const currentRows=relevant.filter(r=>r.raw_payload.role==="CURRENT"&&r.raw_payload.month===currentMonth)
 const currentParsed=currentRows.map(r=>({row:r,o:observation(r,input.code)})).filter(x=>x.o) as Array<{row:BankValuationLedgerRecord;o:BankValuationObservation}>
 if(currentParsed.length!==1)return fail(currentParsed.length?"BANK_VALUATION_CURRENT_DUPLICATE_CONFLICT":"BANK_VALUATION_CURRENT_PIT_MISSING")
 const current=currentParsed[0]!,currentO=current.o
 if(ts(currentO.sourcePublishedAt)>ts(currentO.priceAsOf)||ts(currentO.priceAsOf)>asOfMs)
  return fail("BANK_VALUATION_CURRENT_LOOKAHEAD_OR_DATE_INVALID")
 const historical=relevant.filter(r=>r.raw_payload.role==="HISTORICAL").map(r=>({row:r,o:observation(r,input.code)})).filter(x=>x.o) as Array<{row:BankValuationLedgerRecord;o:BankValuationObservation}>
 const sameBasis=historical.filter(x=>x.o.reportingScope===currentO.reportingScope&&x.o.corporateActionBasis===currentO.corporateActionBasis)
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
