import {BANK_VALUATION_LEDGER_RECORD_KIND,type BankValuationLedgerRecord} from "./v14-bank-valuation-ledger.ts"

/** Keep a complete, stable source-cutoff read. The thirteen-bank ledger exceeds
 * PostgREST's default row limit once both historical valuation families exist. */
export async function loadBankValuationSourceRecords(input:{
 readonly securityIds:readonly string[];readonly sourceCutoffAt:string
 readonly readPage:(offset:number,limit:number)=>Promise<{data:unknown;error:unknown}>
}):Promise<BankValuationLedgerRecord[]>{
 const allowed=new Set(input.securityIds),cutoff=Date.parse(input.sourceCutoffAt)
 if(!Number.isFinite(cutoff))throw Error("BANK_VALUATION_SOURCE_CUTOFF_INVALID")
 if(!allowed.size)return[]
 const result:BankValuationLedgerRecord[]=[],seen=new Set<string>()
 for(let offset=0;offset<10000;offset+=500){
  const page=await input.readPage(offset,500)
  if(page.error)throw Error("BANK_VALUATION_SOURCE_READ_FAILED")
  if(!Array.isArray(page.data)||page.data.length>500)throw Error("BANK_VALUATION_SOURCE_PAGE_INVALID")
  for(const value of page.data){
   if(!value||typeof value!=="object")throw Error("BANK_VALUATION_SOURCE_ROW_INVALID")
   const row=value as BankValuationLedgerRecord,payload=row.raw_payload
   const retrievedAt=Date.parse(row.retrieved_at)
   if(row.record_kind!==BANK_VALUATION_LEDGER_RECORD_KIND||typeof row.id!=="string"||!row.id||
      !payload||typeof payload!=="object"||Array.isArray(payload)||
      !allowed.has(String(payload.security_id??""))||!Number.isFinite(retrievedAt)||retrievedAt>cutoff)
    throw Error("BANK_VALUATION_SOURCE_SCOPE_INVALID")
   if(seen.has(row.id))throw Error("BANK_VALUATION_SOURCE_PAGINATION_CONFLICT")
   seen.add(row.id);result.push(row)
  }
  if(page.data.length<500)return result
 }
 throw Error("BANK_VALUATION_SOURCE_READ_BOUND_EXCEEDED")
}
