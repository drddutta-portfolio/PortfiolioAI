import {describe,it,expect} from "vitest"
import {verifiedBudgetSettlement,verifiedUsageEvent} from "./v14-bank-maintenance-accounting.ts"
describe("banking maintenance persisted provider accounting",()=>{
 const expected={id:"reservation",consumed:12,failed:1,released:1}
 const row={reservation_id:"reservation",status:"SETTLED",consumed_units:12,failed_units:1,released_units:1}
 it("requires an actual recorded usage-event identity",()=>{
  expect(()=>verifiedUsageEvent({data:"00000000-0000-4000-8000-000000000001",error:null})).not.toThrow()
  for(const result of [{data:null,error:null},{data:"------------------------------------",error:null},{data:"00000000-0000-4000-8000-000000000001",error:{message:"write denied"}}])expect(()=>verifiedUsageEvent(result)).toThrow("BANK_MAINTENANCE_USAGE_ACCOUNTING_FAILED")
 })
 it("checks exact settled reservation identity and every reserved unit",()=>{
  expect(()=>verifiedBudgetSettlement({data:[row],error:null},expected)).not.toThrow()
  for(const patch of [{status:"RESERVED"},{reservation_id:"other"},{consumed_units:13},{failed_units:0},{released_units:0}])expect(()=>verifiedBudgetSettlement({data:[{...row,...patch}],error:null},expected)).toThrow("BANK_MAINTENANCE_SETTLEMENT_NOT_VERIFIED")
  expect(()=>verifiedBudgetSettlement({data:[row],error:{message:"rpc failed"}},expected)).toThrow()
  expect(()=>verifiedBudgetSettlement({data:[],error:null},expected)).toThrow()
 })
})
