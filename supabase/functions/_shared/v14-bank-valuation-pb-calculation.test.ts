import {describe,it,expect} from "vitest"
import {calculateBankPbMultiple,type BankPbCalculationInput} from "./v14-bank-valuation-pb-calculation.ts"

const base:BankPbCalculationInput={rawClose:"200",capital:"2",reservesAndSurplus:"98",currency:"INR",amountScale:"INR",
 fullyPaidShares:"1",equityPeriodEnd:"2025-03-31",sharesPeriodEnd:"2025-03-31",reportingScope:"STANDALONE",
 shareCountBasis:"FULLY_PAID_OUTSTANDING",bookBasis:"STATUTORY_COMMON_EQUITY",priceBasis:"RAW_CONTEMPORANEOUS_CLOSE",
 equityAvailableAt:"2025-05-19T11:00:00Z",sharesAvailableAt:"2025-04-17T15:00:00Z",priceAsOf:"2025-05-30T10:00:00Z",
 evaluationAsOf:"2026-10-12T10:00:00Z",denominatorShareFactorNumerator:"1",denominatorShareFactorDenominator:"1",shareAlignment:"SOURCE_QUALIFIED"}
describe("approved unadjusted statutory P/B calculation",()=>{
 it("calculates price/book from common equity and fully paid shares without admission",()=>{
  expect(calculateBankPbMultiple(base)).toMatchObject({state:"CALCULATED_NOT_ADMITTED",bookValuePerShare:"100.0000000000000000",multiple:"2.0000000000000000"})
 })
 it("applies a verified 1-for-5 bonus only to an older denominator on raw price basis",()=>{
  expect(calculateBankPbMultiple({...base,rawClose:"100",denominatorShareFactorNumerator:"5",denominatorShareFactorDenominator:"6"}))
   .toMatchObject({state:"CALCULATED_NOT_ADMITTED",multiple:"1.2000000000000000"})
 })
 it("converts original monetary units without intermediate book-value rounding",()=>{
  expect(calculateBankPbMultiple({...base,rawClose:"1",capital:"1",reservesAndSurplus:"1",fullyPaidShares:"3"}))
   .toMatchObject({state:"CALCULATED_NOT_ADMITTED",multiple:"1.5000000000000000"})
  expect(calculateBankPbMultiple({...base,capital:"0.00002",reservesAndSurplus:"0.00098",amountScale:"INR_LAKH"}))
   .toMatchObject({state:"CALCULATED_NOT_ADMITTED",multiple:"2.0000000000000000"})
 })
 it("rejects issued-share substitutes, dividend-adjusted books and already adjusted prices",()=>{
  for(const patch of [{shareCountBasis:"ISSUED"},{bookBasis:"NET_OF_PROPOSED_DIVIDEND"},{priceBasis:"ADJUSTED_CLOSE"},{shareAlignment:"UNKNOWN"}])
   expect(calculateBankPbMultiple({...base,...patch} as BankPbCalculationInput).state).toBe("REVIEW_REQUIRED")
 })
 it("blocks mismatched periods, future publications and after-close same-day share filings",()=>{
  for(const patch of [{sharesPeriodEnd:"2025-06-30"},{equityAvailableAt:"2025-06-01T00:00:00Z"},
   {sharesAvailableAt:"2025-05-30T10:01:00Z"},{priceAsOf:"2026-11-01T00:00:00Z"},{equityAvailableAt:"invalid"}])
   expect(calculateBankPbMultiple({...base,...patch}).state).toBe("REVIEW_REQUIRED")
 })
 it("keeps missing, non-finite, fractional and nonpositive share counts blocked",()=>{
  for(const value of ["", "0", "-1", "NaN", "1.5", "1e3"])
   expect(calculateBankPbMultiple({...base,fullyPaidShares:value}).state).toBe("REVIEW_REQUIRED")
 })
 it("preserves adverse reserves and rejects nonpositive equity or unsupported units",()=>{
  expect(calculateBankPbMultiple({...base,capital:"102",reservesAndSurplus:"-2"}))
   .toMatchObject({state:"CALCULATED_NOT_ADMITTED",multiple:"2.0000000000000000"})
  expect(calculateBankPbMultiple({...base,capital:"2",reservesAndSurplus:"-2"}).state).toBe("REVIEW_REQUIRED")
  expect(calculateBankPbMultiple({...base,amountScale:"__proto__"} as BankPbCalculationInput).state).toBe("REVIEW_REQUIRED")
 })
 it("rejects normalized impossible calendar dates and ambiguous source times",()=>{
  expect(calculateBankPbMultiple({...base,equityPeriodEnd:"2025-02-31",sharesPeriodEnd:"2025-02-31"}).state).toBe("REVIEW_REQUIRED")
  expect(calculateBankPbMultiple({...base,sharesAvailableAt:"2025-04-17"}).state).toBe("REVIEW_REQUIRED")
 })
})
