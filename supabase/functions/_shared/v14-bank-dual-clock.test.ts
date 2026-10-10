import {describe,it,expect} from "vitest";
import {bankDualClockExpiry,bankReportingDeadline,BANK_DIRECT_CEILINGS} from "./v14-bank-dual-clock.ts";
import {validateObservationSeries,type InputObservation,type MetricDefinition} from "./p7-ic-input-validation.ts";
const d=(s:string)=>Date.parse(s);
const base={code:"CET1_RATIO",periodEnd:"2026-06-30",lastVerifiedOriginalBytesAt:"2026-10-09T19:25:46Z",publishedAt:"2026-07-20T12:00:00Z",retrievedAt:"2026-10-09T19:06:22Z",cutoffAtMs:d("2026-10-10T00:00:00Z")};
const def:MetricDefinition={code:"CET1_RATIO",value_kind:"NUMERIC",canonical_unit:"PERCENT",is_active:true,freshness_seconds:150*86400,
 definition:{selection:"REVIEWED",period_type:"REGULATORY_AS_OF",source_priority:["COMPANY_EXCHANGE_FILING"],dual_clock_policy:"BANK_DIRECT_150D_550D_DUAL_CLOCK_V1"}};
const observation:InputObservation={id:"c1",metric_code:"CET1_RATIO",numeric_value:"17.98",text_value:null,boolean_value:null,date_value:null,unit:"PERCENT",
 currency:null,consolidation_scope:"STANDALONE",period_start:"2026-06-30",period_end:"2026-06-30",period_type:"REGULATORY_AS_OF",
 retrieved_at:base.retrievedAt,source_verified_at:base.lastVerifiedOriginalBytesAt,published_at:base.publishedAt,
 fresh_until:new Date(bankReportingDeadline(base.periodEnd,150)).toISOString(),evidence_status:"AVAILABLE",source_code:"COMPANY_EXCHANGE_FILING",source_record_id:"source-1"};
const evalRows=(rows:InputObservation[],asOf:string="2026-10-09T19:25:46Z")=>validateObservationSeries({rows,definitions:[def],minimum:1,evaluationAsOfMs:d(asOf),sourceCutoffAtMs:d(asOf)});
describe("owner approved BANK financial dual clock",()=>{
 it("uses 150d quarter/regulatory and 550d annual reporting ceiling",()=>{
  expect(BANK_DIRECT_CEILINGS.NIM_TTM).toBe(150);expect(BANK_DIRECT_CEILINGS.CET1_RATIO).toBe(150);
  expect(BANK_DIRECT_CEILINGS.CAPITAL_ADEQUACY_RATIO).toBe(150);expect(BANK_DIRECT_CEILINGS.ROA_ANNUAL).toBe(550);
 });
 it("old filing downloaded today cannot extend financial reporting window",()=>{
  const x=bankDualClockExpiry({...base,lastVerifiedOriginalBytesAt:"2027-01-01T00:00:00Z",cutoffAtMs:d("2027-01-01T00:00:00Z")});
  expect(x.expiryMs).toBe(bankReportingDeadline("2026-06-30",150));
 });
 it("uses earlier of reporting, source verification and an adverse event",()=>{
  const x=bankDualClockExpiry({...base,lastVerifiedOriginalBytesAt:"2026-06-30T00:00:00Z"});
  expect(x.expiryMs).toBe(d("2026-11-27T00:00:00Z"));
  const adverse=bankDualClockExpiry({...base,disqualifyingEventAt:"2026-09-30T00:00:00Z"});
  expect(adverse.expiryMs).toBe(d("2026-09-30T00:00:00Z"));
 });
 it("rejects a late document published after evaluation",()=>{
  expect(bankDualClockExpiry({...base,publishedAt:"2026-10-11T00:00:00Z"}).ok).toBe(false);
 });
 it("requires proven original-byte verification rather than mere new retrieval",()=>{
  expect(evalRows([{...observation,source_verified_at:null}]).reason).toBe("BANK_DIRECT_ORIGINAL_VERIFICATION_REQUIRED");
  const old={...observation,period_start:"2025-06-30",period_end:"2025-06-30"};
  expect(evalRows([old]).reason).toBe("BANK_DUAL_CLOCK_FRESH_UNTIL_EXCEEDS_EXPIRY");
 });
 it("accepts approved UNKNOWN publication via proven current availability without resetting period age",()=>{
  const unknown={...observation,published_at:null,proven_availability_at:"2026-10-09T19:06:22Z"};
  expect(evalRows([unknown]).state).toBe("FRESH");
  const x=bankDualClockExpiry({...base,publishedAt:null,provenAvailabilityAt:"2026-10-09T19:06:22Z"});
  expect(x.expiryMs).toBe(bankReportingDeadline("2026-06-30",150));
 });
 it("does not admit UNKNOWN publication without a proven availability bound",()=>{
  expect(evalRows([{...observation,published_at:null,proven_availability_at:null}]).reason).toBe("BANK_DIRECT_ORIGINAL_VERIFICATION_REQUIRED");
 });
 it("blocks unauthorized fresh_until but accepts a bounded direct source",()=>{
  expect(evalRows([observation]).state).toBe("FRESH");
  expect(evalRows([{...observation,fresh_until:"2027-03-01T00:00:00Z"}]).reason).toBe("BANK_DUAL_CLOCK_FRESH_UNTIL_EXCEEDS_EXPIRY");
 });
 it("does not use a retrieval failure as a fresh verification",()=>{
  expect(evalRows([{...observation,source_verified_at:"2026-01-01T00:00:00Z"}]).reason).toBe("BANK_DUAL_CLOCK_FRESH_UNTIL_EXCEEDS_EXPIRY");
 });
 it("keeps accepted historical reports but expires them at evaluation",()=>{
  const late="2026-12-01T00:00:00Z";
  const earlier={...observation,source_verified_at:"2026-10-09T19:25:46Z"};
  expect(evalRows([earlier],late).state).not.toBe("FRESH");
 });
});
