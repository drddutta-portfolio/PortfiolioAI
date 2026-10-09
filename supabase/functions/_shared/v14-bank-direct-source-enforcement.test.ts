import {describe,it,expect} from "vitest";
import {validateObservationSeries,type MetricDefinition,type InputObservation} from "./p7-ic-input-validation.ts";
import reviewSource from "./v14-reviewed-evidence.ts?raw";
const asOf=Date.parse("2026-10-09T18:00:00Z");
const cutoff=Date.parse("2026-10-09T19:00:00Z");
const definition:MetricDefinition={
 code:"CET1_RATIO",canonical_unit:"PERCENT",value_kind:"NUMERIC",is_active:true,freshness_seconds:150*86400,
 definition:{selection:"REVIEWED",period_type:"REGULATORY_AS_OF",
 source_priority:["COMPANY_EXCHANGE_FILING","NSE_OFFICIAL","TRENDLYNE_MCP"]}
};
const row:InputObservation={
 id:"source-fact-1",metric_code:"CET1_RATIO",numeric_value:"17.98",text_value:null,boolean_value:null,date_value:null,
 unit:"PERCENT",currency:null,consolidation_scope:"STANDALONE",period_start:"2026-06-30",period_end:"2026-06-30",
 period_type:"REGULATORY_AS_OF",retrieved_at:"2026-10-09T17:00:00Z",fresh_until:"2026-10-16T00:00:00Z",
 published_at:"2026-07-22T13:00:00Z",evidence_status:"AVAILABLE",source_code:"COMPANY_EXCHANGE_FILING",
 source_record_id:"official-original-fact-1"
};
const run=(rows:readonly InputObservation[])=>validateObservationSeries({
 rows,definitions:[definition],minimum:1,evaluationAsOfMs:asOf,sourceCutoffAtMs:cutoff
});
describe("bank direct source authority, provenance and basis",()=>{
 it("honours official issuer source hierarchy when numeric contract is reviewed",()=>{
  expect(run([row]).state).toBe("FRESH");
 });
 it("rejects provider outside explicit allowlist",()=>{
  const r=run([{...row,source_code:"UNKNOWN_TERTIARY_VENDOR"}]);
  expect(r.state).toBe("REVIEW_REQUIRED");
  expect(r.reason).toBe("SOURCE_AUTHORITY_MISMATCH");
 });
 it("rejects missing or future provenance",()=>{
  expect(run([{...row,source_record_id:""}]).reason).toBe("SOURCE_PROVENANCE_NOT_PROVEN");
  expect(run([{...row,retrieved_at:"2026-10-12T17:00:00Z"}]).reason).toBe("SOURCE_PROVENANCE_NOT_PROVEN");
  expect(run([{...row,published_at:"2026-10-11T17:00:00Z"}]).reason).toBe("SOURCE_PROVENANCE_NOT_PROVEN");
 });
 it("rejects mixed incompatible provider bases",()=>{
  const r=run([row,{...row,id:"source-fact-2",source_record_id:"trendlyne-2",source_code:"TRENDLYNE_MCP"}]);
  expect(r.state).toBe("REVIEW_REQUIRED");
  expect(r.reason).toBe("SERIES_BASIS_RECONCILIATION_REQUIRED");
 });
 it("rejects period type and reporting perimeter changes",()=>{
  expect(run([{...row,period_type:"QUARTER"}]).reason).toBe("REPORTING_PERIOD_TYPE_NOT_PROVEN");
  expect(run([{...row,consolidation_scope:"UNKNOWN"}]).reason).toBe("REPORTING_SCOPE_NOT_PROVEN");
 });
 it("requires exact security identity inside the canonical factual reviewer",()=>{
  expect(reviewSource).toContain("BANK_DIRECT_ISSUER_SECURITY_IDENTITY_NOT_PROVEN");
  expect(reviewSource).toContain("str(source.raw_payload.security_id)!==securityId");
  expect(reviewSource).toContain("BANK_DIRECT_SOURCE_AUTHORITY_NOT_APPROVED");
  expect(reviewSource).toContain("approvedSources.includes(source.source_code)");
  expect(reviewSource).toContain("REVIEW_SOURCE_HASH_OR_RECORD_INVALID");
  expect(reviewSource).toContain("DELEGATED_SOURCE_AUTHORITY_NOT_PROVEN");
 });
});
