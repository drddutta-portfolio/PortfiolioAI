import {describe,it,expect} from "vitest"
import {loadBankValuationSourceRecords} from "./v14-bank-valuation-source-loading.ts"
import {BANK_VALUATION_LEDGER_RECORD_KIND,evaluateBankValuationLedger} from "./v14-bank-valuation-ledger.ts"

const row=(i:number)=>({id:`source-${i}`,record_kind:BANK_VALUATION_LEDGER_RECORD_KIND,
 retrieved_at:"2026-10-12T03:00:00Z",raw_payload:{security_id:"bank-a"}})
const base={securityIds:["bank-a"],sourceCutoffAt:"2026-10-12T04:00:00Z"}
describe("canonical valuation source loading",()=>{
 it("loads all pages beyond the default 1000-row limit",async()=>{
  const rows=Array.from({length:1501},(_,i)=>row(i)),offsets:number[]=[]
  const loaded=await loadBankValuationSourceRecords({...base,readPage:async(offset,limit)=>{
   offsets.push(offset);return{data:rows.slice(offset,offset+limit),error:null}
  }})
  expect(loaded).toHaveLength(1501);expect(offsets).toEqual([0,500,1000,1500])
 })
 it("never hides read failures, cross-owner targets or future sources",async()=>{
  for(const result of [{data:[],error:{message:"database unavailable"}},
   {data:[{...row(1),raw_payload:{security_id:"other-bank"}}],error:null},
   {data:[{...row(1),retrieved_at:"2026-10-13T00:00:00Z"}],error:null}])
   await expect(loadBankValuationSourceRecords({...base,readPage:async()=>result})).rejects.toThrow()
 })
 it("rejects duplicate pages instead of falsely counting coverage",async()=>{
  const page=Array.from({length:500},(_,i)=>row(i))
  await expect(loadBankValuationSourceRecords({...base,readPage:async()=>({data:page,error:null})}))
   .rejects.toThrow("BANK_VALUATION_SOURCE_PAGINATION_CONFLICT")
 })
 it("passes loaded admitted sources to the existing canonical comparator",async()=>{
  const historical=Array.from({length:60},(_,i)=>{
   const month=new Date(Date.UTC(2021,9+i,1)).toISOString().slice(0,7)
   return{...row(i),raw_payload:{security_id:"bank-a",version:"V1_4_BANK_VALUATION_PIT_LEDGER_V1",
    requirement_code:"PB_RELATIVE",role:"HISTORICAL",month,multiple:2.5,admitted:true,
    source_published_at:month+"-01T00:00:00Z",price_as_of:month+"-28T00:00:00Z",
    reporting_scope:"STANDALONE",corporate_action_basis:"SPLIT_ALIGNED",source_hash:"a".repeat(64),
    price_source_record_ids:["price"],denominator_source_record_ids:["book"],corporate_action_source_record_ids:["actions"]}}
  })
  const current={...historical[0]!,id:"current",raw_payload:{...historical[0]!.raw_payload,role:"CURRENT",month:"2026-10",
   multiple:2,source_published_at:"2026-09-01T00:00:00Z",price_as_of:"2026-10-09T10:00:00Z"}}
  const loaded=await loadBankValuationSourceRecords({...base,readPage:async()=>({data:[...historical,current],error:null})})
  const result=evaluateBankValuationLedger({code:"PB_RELATIVE",securityId:"bank-a",asOf:base.sourceCutoffAt,rows:loaded})
  expect(result.state).toBe("FRESH");expect(result.eligibleMonths).toBe(60);expect(result.ratio).toBeCloseTo(0.8)
 })
})
