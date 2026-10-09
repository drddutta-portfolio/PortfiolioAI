import {describe,it,expect} from "vitest";
import issuerPolicy from "./v14-bank-verified-issuer-delegation.json";
import {approvedBankOfficialFallback} from "./v14-bank-approved-delegation.ts";
import type {RequirementReview,ReviewedSourceRecord} from "./v14-reviewed-evidence.ts";
const securityId="5760ce4e-97ac-40ef-af3b-d2a5dce596cf";
const sha="fb01aa8597ecff1a2ddad6d24c993a71f04f643d2f86fd788ba1d1d5720f559c";
const review={
 id:"test-1",portfolio_id:issuerPolicy.portfolioId,security_id:securityId,
 requirement_code:"CET1_RATIO",review_kind:"DELEGATED_NUMERIC_REVIEW",decision:"ACCEPTED",
 source_record_id:"source-1",research_document_id:null,provider_document_id:null,source_payload_hash:"a".repeat(64),
 supporting_quote:"CET1 CRAR 16.11%",period_start:"2026-06-30",period_end:"2026-06-30",period_type:"REGULATORY_AS_OF",
 unit:"PERCENT",currency:null,consolidation_scope:"CONSOLIDATED",published_at:"2026-07-18T09:00:00Z",
 retrieved_at:"2026-10-09T19:06:22Z",fresh_through:"2026-11-27T23:59:59Z",review_version:"V1_4_REQUIREMENT_REVIEW_V2",
 reviewed_by:null,reviewed_at:"2026-10-09T20:00:00Z",review_hash:"a".repeat(64),supersedes_review_id:null,
 metadata:{review_authorization:{policy_id:issuerPolicy.id,authorizing_owner_id:issuerPolicy.ownerId,
 executor:issuerPolicy.executor,authorization:issuerPolicy.authorization,recorded_at:issuerPolicy.recordedAt}},
} satisfies RequirementReview;
const source={
 id:"source-1",source_code:"COMPANY_EXCHANGE_FILING",published_at:"2026-07-18T09:00:00Z",retrieved_at:"2026-10-09T19:06:22Z",
 payload_hash:"a".repeat(64),raw_payload:{
 security_id:securityId,policy_id:issuerPolicy.id,symbol:"ICICIBANK",source_scope:"CONSOLIDATED",
 original_url:"https://www.icici.bank.in/content/dam/icicibank/missing-assets/basel-pillar-3-disclosureat-june-30-2026.pdf",
 original_sha256:sha,r2_verified_sha256:sha,r2_bucket:issuerPolicy.storageBucket,
 r2_object_key:issuerPolicy.storageKeyPrefix+sha+".pdf",original_bytes_verified_at:"2026-10-09T19:25:46Z",
 published_at:"2026-07-18T09:00:00Z",
 },
} satisfies ReviewedSourceRecord;
const permits=(s:ReviewedSourceRecord=source,r:RequirementReview=review)=>approvedBankOfficialFallback(r,s,issuerPolicy.ownerId,"NUMERIC_SERIES");
describe("owner-approved issuer-hosted BANK M1-M4 fallback",()=>{
 it("accepts only precisely scoped original byte-linked official issuer sources for subsequent factual review",()=>expect(permits()).toBe(true));
 it("accepts only the exact official SBI document permalink pattern",()=>{
  const id="d77abadc-d171-49d9-bfee-0b34dd0281f4"
  const sha="6cb4b2e20a0e72dbdfc266b578e77873f8d46a98e9d950cb8a80719aaf20c426"
  const original_url="https://sbi.bank.in/documents/17826/34672/07.08.2026_FINAL%2BP3D-DFs%2BJUNE%2B2026%2BDTD%2B07082026.pdf/ff6f28c2-855a-31e9-2d79-9b1ef8dc36b9?t=1786100952704"
  const sourceForSbi={...source,raw_payload:{...source.raw_payload,security_id:id,symbol:"SBIN",original_url,
    original_sha256:sha,r2_verified_sha256:sha,r2_object_key:issuerPolicy.storageKeyPrefix+sha+".pdf"}}
  const reviewForSbi={...review,security_id:id}
  expect(permits(sourceForSbi,reviewForSbi)).toBe(true)
  expect(permits({...sourceForSbi,raw_payload:{...sourceForSbi.raw_payload,original_url:original_url+"&other=true"}},reviewForSbi)).toBe(false)
 });
 it("blocks a foreign issuer host",()=>expect(permits({...source,raw_payload:{...source.raw_payload,original_url:"https://example.com/official.pdf"}})).toBe(false));
 it("blocks wrong bank identity",()=>expect(permits({...source,raw_payload:{...source.raw_payload,security_id:"other-bank"}})).toBe(false));
 it("blocks unverified original-byte hash",()=>expect(permits({...source,raw_payload:{...source.raw_payload,r2_verified_sha256:"b".repeat(64)}})).toBe(false));
 it("blocks missing durable storage linkage",()=>expect(permits({...source,raw_payload:{...source.raw_payload,r2_object_key:""}})).toBe(false));
 it("blocks missing issuer publication timestamp",()=>expect(permits({...source,raw_payload:{...source.raw_payload,published_at:null}})).toBe(false));
 it("blocks out-of-scope valuation requirements",()=>expect(permits(source,{...review,requirement_code:"PB_RELATIVE"})).toBe(false));
 it("blocks arbitrary review executor or missing owner authorization",()=>{
 expect(permits(source,{...review,metadata:{review_authorization:{...review.metadata.review_authorization,executor:"UNAUTHORIZED"}}})).toBe(false);
 });
 it("never impersonates existing NPA delegation",()=>expect(permits(source,{...review,requirement_code:"GROSS_NPA"})).toBe(false));
});
