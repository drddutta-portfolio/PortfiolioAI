import {describe,it,expect} from "vitest"
import {KVB_ORIGINAL_PROOF as proof,KVB_ORIGINAL_KIND,KVB_ROA_SECURITY,KVB_ROA_PORTFOLIO,
 kvbOriginalKey,kvbRoaBinding,kvbRoaBindingQualified,githubImportClaimsQualified,approvedOriginalReadUrl} from "./v14-kvb-roa-original-proof.ts"
import {validateReviewedRequirementEvidence,type RequirementReview,type ReviewedSourceRecord} from "./v14-reviewed-evidence.ts"
import type {MetricDefinition} from "./p7-ic-input-validation.ts"
const hash="a".repeat(64),owner="f9e48c4c-d796-424b-95f7-2a4a97149543"
const regulator:ReviewedSourceRecord={id:"regulator",source_code:"CONTROLLED_PUBLIC_WEB",record_kind:KVB_ORIGINAL_KIND,
 retrieved_at:proof.regulator.firstVerifiedAt,published_at:null,payload_hash:hash,raw_payload:{original_url:proof.regulator.originalUrl,
 original_sha256:proof.regulator.sha256,denominator:proof.regulator.denominator,roa:proof.regulator.roa}}
const source:ReviewedSourceRecord={id:"issuer",source_code:"COMPANY_EXCHANGE_FILING",record_kind:KVB_ORIGINAL_KIND,
 retrieved_at:proof.issuer.firstVerifiedAt,published_at:null,payload_hash:hash,raw_payload:{security_id:KVB_ROA_SECURITY,
 original_url:proof.issuer.originalUrl,original_sha256:proof.issuer.sha256,original_bytes:proof.issuer.bytes,
 original_bytes_verified_at:proof.issuer.firstVerifiedAt,r2_verified_sha256:proof.issuer.sha256,r2_bucket:"portfolioai-history-dev",
 r2_object_key:kvbOriginalKey("issuer"),source_scope:"STANDALONE",table_fragment:proof.issuer.table,
 period_anchor:proof.issuer.periodAnchor,identity_anchor:proof.issuer.identityAnchor,publication_precision:"UNKNOWN",
 first_verified_available_at:proof.issuer.firstVerifiedAt,roa_regulatory_proof:{source_record_id:regulator.id,
 original_sha256:proof.regulator.sha256,official_url:proof.regulator.originalUrl,denominator:proof.regulator.denominator,
 roa:proof.regulator.roa,commencement:proof.regulator.commencement}}}
const stable=(v:unknown):string=>Array.isArray(v)?"["+v.map(stable).join(",")+"]":v!==null&&typeof v==="object"
 ?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}":JSON.stringify(v)??"null"
async function review():Promise<RequirementReview>{
 const r={id:"review",portfolio_id:KVB_ROA_PORTFOLIO,security_id:KVB_ROA_SECURITY,requirement_code:"ROA_ANNUAL",
 review_kind:"OWNER_NUMERIC_REVIEW",decision:"ACCEPTED",source_record_id:source.id,research_document_id:null,provider_document_id:null,
 source_payload_hash:hash,supporting_quote:proof.issuer.table,period_start:"2025-04-01",period_end:"2026-03-31",period_type:"YEAR",
 unit:"PERCENT",currency:null,consolidation_scope:"STANDALONE",published_at:null,retrieved_at:source.retrieved_at,
 fresh_through:"2027-09-30T23:59:59.999Z",review_version:"V1_4_REQUIREMENT_REVIEW_V2",reviewed_by:owner,
 reviewed_at:"2026-10-11T18:00:00Z",supersedes_review_id:null,
 metadata:{metric_code:"ROA_ANNUAL",numeric_value:"1.93",source_binding:kvbRoaBinding(),regulator_source_record_id:regulator.id,regulator_source_payload_hash:hash}}
 const payload={...r} as Record<string,unknown>
 delete payload.id
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(stable(payload)))
 return {...r,review_hash:Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("")}
}
const definition:MetricDefinition={code:"ROA_ANNUAL",canonical_unit:"PERCENT",value_kind:"NUMERIC",is_active:true,freshness_seconds:47520000,
 definition:{selection:"REVIEWED",source_priority:["COMPANY_EXCHANGE_FILING"],period_type:"YEAR",scope_guard:"STANDALONE",freshness_policy:"BANK_DIRECT_150D_550D_DUAL_CLOCK_V1"}}
async function evaluate(sources:ReviewedSourceRecord[],r?:RequirementReview){return validateReviewedRequirementEvidence({
 portfolioId:KVB_ROA_PORTFOLIO,portfolioOwnerId:owner,securityId:KVB_ROA_SECURITY,requirementCode:"ROA_ANNUAL",
 family:"NUMERIC_SERIES",metricCodes:["ROA_ANNUAL"],minimum:1,reviews:[r??await review()],sources,documents:[],documentSources:[],
 definitions:[definition],evaluationAsOfMs:Date.parse("2026-10-11T18:05:00Z"),sourceCutoffAtMs:Date.parse("2026-10-11T18:05:00Z"),freshnessPolicy:"BANK_DIRECT_150D_550D_DUAL_CLOCK_V1"})}
const claims={repository:"drddutta-portfolio/PortfiolioAI",repository_id:"1357024254",ref:"refs/heads/codex/banking-source-remediation",
 environment:"PortfolioAI-Development",sub:"repo:drddutta-portfolio/PortfiolioAI:environment:PortfolioAI-Development",
 workflow_ref:"drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-kvb-source-import.yml@refs/heads/codex/banking-source-remediation",event_name:"push",sha:"a".repeat(40)}
describe("Pinned KVB original admission",()=>{
 it("restricts signed CI claims to the approved repository, branch, workflow and Development environment",()=>{
  expect(githubImportClaimsQualified(claims)).toBe(true)
  for(const patch of [{repository:"other/repo"},{ref:"refs/heads/main"},{environment:"Production"},{event_name:"pull_request"},{sub:"other"},{workflow_ref:"other"}])
   expect(githubImportClaimsQualified({...claims,...patch})).toBe(false)
 })
 it("restricts transport to exact approved R2 object paths without redirects",()=>{
  const url=`https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com/portfolioai-history-dev/${kvbOriginalKey("issuer")}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=120`
  expect(approvedOriginalReadUrl(url,"issuer")).toBe(true)
  for(const bad of [url.replace("portfolioai-history-dev","production"),url.replace("120","999"),url.replace("https:","http:"),url+"#redirect"])
   expect(approvedOriginalReadUrl(bad,"issuer")).toBe(false)
 })
 it("binds individually extracted original anchors instead of demanding fabricated dates in the table",()=>{
  expect(proof.issuer.table).not.toContain("01-04-2025")
  expect(kvbRoaBindingQualified(source as unknown as Record<string,unknown>,kvbRoaBinding())).toBe(true)
  for(const patch of [{exact_value:"1.72"},{period_start:"2024-04-01"},{entity_id:"SBIN"},{fragment:"invented quotation"}])
   expect(kvbRoaBindingQualified(source as unknown as Record<string,unknown>,{...kvbRoaBinding(),...patch})).toBe(false)
 })
 it("rejects substituted bytes, storage identity and missing regulatory proof",()=>{
  for(const patch of [{original_sha256:"b".repeat(64)},{r2_object_key:"other"},{security_id:"other"},{roa_regulatory_proof:null}])
   expect(kvbRoaBindingQualified({...source,raw_payload:{...source.raw_payload,...patch}},kvbRoaBinding())).toBe(false)
 })
 it("requires the independent regulator source record during canonical evaluation",async()=>{
  expect(await evaluate([source])).toMatchObject({state:"REVIEW_REQUIRED",reason:"KVB_REGULATOR_ORIGINAL_LINK_NOT_BOUND"})
  expect(await evaluate([source,{...regulator,raw_payload:{...regulator.raw_payload,denominator:"invented"}}])).toMatchObject({state:"REVIEW_REQUIRED",reason:"KVB_REGULATOR_ORIGINAL_LINK_NOT_BOUND"})
 })
 it("rejects independent regulator evidence obtained after the evaluation cutoff",async()=>{
  expect(await evaluate([source,{...regulator,retrieved_at:"2026-10-12T18:00:00Z"}])).toMatchObject({state:"REVIEW_REQUIRED",reason:"KVB_REGULATOR_SOURCE_POST_CUTOFF"})
 })
 it("passes the actual canonical evaluator with faithful original anchors and unknown publication kept null",async()=>{
  const result=await evaluate([source,regulator])
  expect(result?.state,result?.reason).toBe("FRESH")
  expect(result?.observations[0]).toMatchObject({numeric_value:"1.93",published_at:null,period_start:"2025-04-01",period_end:"2026-03-31"})
 })
})
