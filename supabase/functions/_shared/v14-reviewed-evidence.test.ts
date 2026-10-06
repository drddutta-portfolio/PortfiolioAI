import { describe, expect, it } from "vitest"
import { validateReviewedRequirementEvidence, type RequirementReview, type ReviewedSourceRecord, type ReviewedResearchDocument } from "./v14-reviewed-evidence.ts"

const hash="a".repeat(64)
const source:ReviewedSourceRecord={id:"raw",source_code:"COMPANY_EXCHANGE_FILING",retrieved_at:"2026-10-05T10:00:00Z",published_at:"2026-09-30T12:00:00Z",payload_hash:hash,raw_payload:{security_id:"sec",text:"FY2026 consolidated ROCE 12.50% published 30 Sep 2026"}}
const document:ReviewedResearchDocument={id:"doc",security_id:"sec",reporting_period_start:"2025-04-01",reporting_period_end:"2026-03-31",reporting_period_type:"YEAR",published_at:"2026-09-30T12:00:00Z",canonical_content_hash:"b".repeat(64),identity_status:"VERIFIED"}
const definition={code:"ROCE_ANNUAL",canonical_unit:"PERCENT",value_kind:"NUMERIC",is_active:true,freshness_seconds:86400*30,definition:{selection:"REVIEWED",period_type:"YEAR",provider:"COMPANY_EXCHANGE_FILING",scope_guard:"CONSOLIDATED_ATTRIBUTABLE_TO_OWNERS"}}
const review:RequirementReview={
 id:"11111111-1111-4111-8111-111111111111",portfolio_id:"p",security_id:"sec",requirement_code:"ROCE_OR_ROIC",review_kind:"SYSTEM_VALIDATED",decision:"ACCEPTED",
 source_record_id:"raw",research_document_id:"doc",provider_document_id:null,source_payload_hash:hash,supporting_quote:"FY2026 consolidated ROCE 12.50% published 30 Sep 2026",
 period_start:"2025-04-01",period_end:"2026-03-31",period_type:"YEAR",unit:"PERCENT",currency:null,consolidation_scope:"CONSOLIDATED",
 published_at:"2026-09-30T12:00:00Z",retrieved_at:"2026-10-05T10:00:00Z",fresh_through:"2026-10-20T10:00:00Z",review_version:"v1",reviewed_by:null,
 reviewed_at:"2026-10-05T11:00:00Z",review_hash:"c".repeat(64),supersedes_review_id:null,
 metadata:{metric_code:"ROCE_ANNUAL",numeric_value:"12.50",period_anchor:"FY2026",scope_anchor:"consolidated",publication_anchor:"30 Sep 2026",unit_anchor:"% ",document_content_hash:"b".repeat(64),document_excerpt:"FY2026 consolidated ROCE 12.50% published 30 Sep 2026"}
}
const run=(patch:Partial<RequirementReview>={},sources=[source],documents=[document],cutoff="2026-10-05T19:25:54Z")=>validateReviewedRequirementEvidence({
 portfolioId:"p",securityId:"sec",requirementCode:"ROCE_OR_ROIC",metricCodes:["ROCE_ANNUAL"],minimum:1,
 reviews:[{...review,...patch}],sources,documents,definitions:[definition],evaluationAsOfMs:Date.parse("2026-10-05T19:25:54Z"),sourceCutoffAtMs:Date.parse(cutoff)
})

describe("V1-4 review ledger adapter",()=>{
 it("accepts source-bound reviewed numeric evidence through the existing validator",()=>expect(run()).toMatchObject({state:"FRESH",reason:"REVIEWED_CANONICAL_OBSERVATION_READY"}))
 it("rejects wrong portfolio, security and requirement context",()=>{
  expect(validateReviewedRequirementEvidence({portfolioId:"other",securityId:"sec",requirementCode:"ROCE_OR_ROIC",metricCodes:["ROCE_ANNUAL"],minimum:1,reviews:[review],sources:[source],documents:[document],definitions:[definition],evaluationAsOfMs:Date.parse("2026-10-05T19:25:54Z"),sourceCutoffAtMs:Date.parse("2026-10-05T19:25:54Z")})).toBeNull()
  expect(run({security_id:"wrong"})).toBeNull()
  expect(run({requirement_code:"OTHER"})).toBeNull()
 })
 it("fails a source hash mismatch",()=>expect(run({source_payload_hash:"d".repeat(64)})).toMatchObject({state:"REVIEW_REQUIRED",reason:"REVIEW_SOURCE_HASH_MISMATCH"}))
 it("fails missing scope, period or publication proof",()=>{
  expect(run({consolidation_scope:null})).toMatchObject({state:"REVIEW_REQUIRED",reason:"REVIEW_NUMERIC_METADATA_INCOMPLETE"})
  expect(run({metadata:{...review.metadata,period_anchor:"FY2025"}})).toMatchObject({state:"REVIEW_REQUIRED",reason:"REVIEW_PERIOD_ANCHOR_NOT_IN_QUOTE"})
  expect(run({metadata:{...review.metadata,publication_anchor:"1 Oct 2026"}})).toMatchObject({state:"REVIEW_REQUIRED",reason:"REVIEW_PUBLICATION_ANCHOR_NOT_IN_QUOTE"})
 })
 it("recognizes percent field-label evidence without pretending that it proves the whole metadata contract",()=>expect(run({metadata:{...review.metadata,unit_anchor:null}})).toMatchObject({state:"FRESH"}))
 it("does not treat one reviewed annual value as multiple distinct annual observations",()=>{
  const result=validateReviewedRequirementEvidence({portfolioId:"p",securityId:"sec",requirementCode:"ROCE_OR_ROIC",metricCodes:["ROCE_ANNUAL"],minimum:3,reviews:[review],sources:[source],documents:[document],definitions:[definition],evaluationAsOfMs:Date.parse("2026-10-05T19:25:54Z"),sourceCutoffAtMs:Date.parse("2026-10-05T19:25:54Z")})
  expect(result).toMatchObject({state:"INSUFFICIENT",reason:"DISTINCT_REPORTING_PERIODS_INSUFFICIENT"})
 })
 it("requires human reviewer identity when review authority is human",()=>expect(run({review_kind:"HUMAN_DOCUMENT_REVIEW",reviewed_by:null})).toMatchObject({state:"REVIEW_REQUIRED",reason:"HUMAN_REVIEW_AUTHORITY_MISSING"}))
 it("rejects post-cutoff reviews instead of backdating them",()=>expect(run({reviewed_at:"2026-10-06T01:00:00Z"})).toMatchObject({state:"REVIEW_REQUIRED",reason:"REVIEW_CREATED_AFTER_SOURCE_CUTOFF"}))
 it("fails document references without bound body evidence",()=>expect(run({supporting_quote:"invented quote",metadata:{...review.metadata,document_excerpt:"invented quote"}})).toMatchObject({state:"REVIEW_REQUIRED",reason:"REVIEW_QUOTE_NOT_BOUND_TO_SOURCE"}))
 it("honors supersession and detects conflicting active reviews",()=>{
  const prior={...review,id:"22222222-2222-4222-8222-222222222222",review_hash:"d".repeat(64)}
  const newer={...review,id:"33333333-3333-4333-8333-333333333333",review_hash:"e".repeat(64),supersedes_review_id:prior.id}
  const ok=validateReviewedRequirementEvidence({portfolioId:"p",securityId:"sec",requirementCode:"ROCE_OR_ROIC",metricCodes:["ROCE_ANNUAL"],minimum:1,reviews:[prior,newer],sources:[source],documents:[document],definitions:[definition],evaluationAsOfMs:Date.parse("2026-10-05T19:25:54Z"),sourceCutoffAtMs:Date.parse("2026-10-05T19:25:54Z")})
  expect(ok?.selectedReviewIds).toEqual([newer.id])
  const conflict={...review,id:"44444444-4444-4444-8444-444444444444",review_hash:"f".repeat(64),decision:"CONTRADICTS"}
  const bad=validateReviewedRequirementEvidence({portfolioId:"p",securityId:"sec",requirementCode:"ROCE_OR_ROIC",metricCodes:["ROCE_ANNUAL"],minimum:1,reviews:[review,conflict],sources:[source],documents:[document],definitions:[definition],evaluationAsOfMs:Date.parse("2026-10-05T19:25:54Z"),sourceCutoffAtMs:Date.parse("2026-10-05T19:25:54Z")})
  expect(bad).toMatchObject({state:"CONFLICTING",reason:"ACTIVE_REVIEWS_CONFLICT"})
 })
})
