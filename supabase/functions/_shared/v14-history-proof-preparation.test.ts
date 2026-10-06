import {describe,expect,it} from "vitest"
import {corporateActionTreatment,evaluateExchangeCalendarEvidence,evaluateStockHistoryFreshness} from "./v14-history-proof-preparation"

describe("V1-4 history proof preparation",()=>{
 it("does not treat two session canaries as a complete exchange calendar",()=>{
  expect(evaluateExchangeCalendarEvidence({sourceRecordIds:["a","b"],coverageKind:"OFFICIAL_SESSION_CANARIES",requiredFrom:"2025-09-01",requiredTo:"2026-10-06",coveredFrom:"2026-10-01",coveredTo:"2026-10-05"}))
   .toMatchObject({state:"UNVERIFIED",reason:"FULL_WINDOW_OFFICIAL_CALENDAR_NOT_PROVEN",independentOfBenchmarkIdentity:true})
 })
 it("verifies only complete official full-window calendar evidence",()=>{
  expect(evaluateExchangeCalendarEvidence({sourceRecordIds:["calendar"],coverageKind:"COMPLETE_OFFICIAL_EXCHANGE_CALENDAR",requiredFrom:"2025-09-01",requiredTo:"2026-10-06",coveredFrom:"2025-09-01",coveredTo:"2026-10-06"}))
   .toMatchObject({state:"VERIFIED"})
 })
 it("derives split multipliers without relabelling raw close",()=>{
  expect(corporateActionTreatment("Face Value Split (Sub-Division) - From Rs 10/- Per Share To Rs 2/- Per Share"))
   .toMatchObject({kind:"SPLIT",shareMultiplier:5,priceMultiplier:0.2,mechanical:true})
 })
 it("derives ordinary bonus multipliers",()=>{
  expect(corporateActionTreatment("Bonus 1:5")).toMatchObject({kind:"BONUS",shareMultiplier:1.2,priceMultiplier:5/6,mechanical:true})
 })
 it("does not mechanically adjust demergers or NCRPS schemes",()=>{
  expect(corporateActionTreatment("Demerger")).toMatchObject({kind:"NON_MECHANICAL",mechanical:false})
  expect(corporateActionTreatment("Scheme Of Arrangement - Bonus Ncrps 4:1")).toMatchObject({kind:"NON_MECHANICAL",mechanical:false})
 })
 it("retains stale-stock-history independently of benchmark recovery",()=>{
  expect(evaluateStockHistoryFreshness({latestSession:"2026-09-25",requiredFreshThrough:"2026-10-05"})).toMatchObject({state:"STALE"})
  expect(evaluateStockHistoryFreshness({latestSession:"2026-10-05",requiredFreshThrough:"2026-10-05"})).toMatchObject({state:"FRESH"})
 })
})