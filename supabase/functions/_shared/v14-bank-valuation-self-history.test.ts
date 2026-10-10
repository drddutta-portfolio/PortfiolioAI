import {describe,it,expect} from "vitest";
import {compareBankSelfHistory,type BankValuationObservation} from "./v14-bank-valuation-self-history.ts";
const rows:BankValuationObservation[]=Array.from({length:60},(_,i)=>{
 const date=new Date(Date.UTC(2021,9+i,1));
 const month=date.toISOString().slice(0,7);
 return {month,multiple:2.5,sourcePublishedAt:month+"-01T00:00:00Z",priceAsOf:month+"-28T00:00:00Z",
 reportingScope:"STANDALONE",corporateActionBasis:"SPLIT_ALIGNED",sourceHash:"a".repeat(64),admitted:true};
});
const base={code:"PB_RELATIVE" as const,currentMultiple:2,currentMonth:"2026-10",currentScope:"STANDALONE",currentCorporateActionBasis:"SPLIT_ALIGNED",asOf:"2026-10-10T00:00:00Z",historical:rows};
describe("BANK owner-approved M5/M7 comparator without fake admissions",()=>{
 it("uses trailing five-year month-end median and yields 0.8",()=>{
  const r=compareBankSelfHistory(base);expect(r.state).toBe("FRESH");expect(r.referenceMedian).toBe(2.5);expect(r.ratio).toBeCloseTo(0.8);
 });
 it("uses the same comparator for approved P/E TTM only after eligible source evidence",()=>{
  expect(compareBankSelfHistory({...base,code:"PE_TTM_RELATIVE",currentMultiple:18,historical:rows.map(r=>({...r,multiple:15}))}).ratio).toBeCloseTo(1.2);
 });
 it("fails on 35/60 accepted observations",()=>expect(compareBankSelfHistory({...base,historical:rows.slice(0,35)}).reason).toBe("BANK_VALUATION_MIN_36_OF_60_MISSING"));
 it("requires 6 qualified observations in each year",()=>expect(compareBankSelfHistory({...base,historical:rows.filter((_,i)=>i>=24)}).state).toBe("REVIEW_REQUIRED"));
 it("rejects future financial reports, mixed scopes and unsupported original hashes",()=>{
  expect(compareBankSelfHistory({...base,historical:rows.map(r=>({...r,sourcePublishedAt:"2026-11-10T00:00:00Z"}))}).state).toBe("REVIEW_REQUIRED");
  expect(compareBankSelfHistory({...base,historical:rows.map(r=>({...r,reportingScope:"CONSOLIDATED"}))}).state).toBe("REVIEW_REQUIRED");
  expect(compareBankSelfHistory({...base,historical:rows.map(r=>({...r,sourceHash:"unknown"}))}).state).toBe("REVIEW_REQUIRED");
 });
 it("cannot infer point-in-time facts from unaccepted observations",()=>expect(compareBankSelfHistory({...base,historical:rows.map(r=>({...r,admitted:false}))}).state).toBe("REVIEW_REQUIRED"));
 it("blocks duplicate month conflicts and mismatched corporate action basis",()=>{
  expect(compareBankSelfHistory({...base,historical:[...rows,rows[0]!]}).reason).toBe("BANK_VALUATION_DUPLICATE_MONTH_CONFLICT");
  expect(compareBankSelfHistory({...base,historical:rows.map(r=>({...r,corporateActionBasis:"UNADJUSTED"}))}).state).toBe("REVIEW_REQUIRED");
 });
 it("keeps zero/negative denominators blocked",()=>expect(compareBankSelfHistory({...base,historical:rows.map(r=>({...r,multiple:-1}))}).state).toBe("REVIEW_REQUIRED"));
});
