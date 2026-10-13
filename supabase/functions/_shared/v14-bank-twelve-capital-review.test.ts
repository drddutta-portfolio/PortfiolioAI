import {describe,it,expect} from "vitest"
import {prepareTwelveCapitalReview,twelveCapitalClaimsQualified,twelveCapitalReadUrl,bankValueHash,BANK_TWELVE_CAPITAL_MANIFEST} from "./v14-bank-twelve-capital-review.ts"
import {BANK_TWELVE_POLICY,approvedTwelveBankReview,approvedTwelveBankIssuerSource} from "./v14-bank-twelve-delegation.ts"
import {validateReviewedRequirementEvidence} from "./v14-reviewed-evidence.ts"
import type {MetricDefinition} from "./p7-ic-input-validation.ts"
const now="2026-10-12T12:45:00Z"
const definitions:MetricDefinition[]=["CET1_RATIO","CAPITAL_ADEQUACY_RATIO"].map(code=>({code,canonical_unit:"PERCENT",value_kind:"NUMERIC",is_active:true,
 freshness_seconds:12960000,definition:{selection:"REVIEWED",period_type:"REGULATORY_AS_OF",source_priority:["COMPANY_EXCHANGE_FILING"],reporting_age_days:150}}))
async function evaluate(code:string,mutate?:(x:Awaited<ReturnType<typeof prepareTwelveCapitalReview>>)=>void){
 const x=await prepareTwelveCapitalReview(now);mutate?.(x)
 return validateReviewedRequirementEvidence({portfolioId:BANK_TWELVE_POLICY.portfolioId,portfolioOwnerId:BANK_TWELVE_POLICY.ownerId,
  securityId:x.source.raw_payload.security_id as string,requirementCode:code,family:"NUMERIC_SERIES",metricCodes:[code],minimum:1,
  reviews:x.reviews,sources:[x.source],documents:[],documentSources:[],definitions,evaluationAsOfMs:Date.parse(now),sourceCutoffAtMs:Date.parse(now),freshnessPolicy:null})
}
describe("twelve-bank source-bound capital admission",()=>{
 it("qualifies actual standalone CET1 and total CAR through the canonical reviewer",async()=>{
  for(const code of ["CET1_RATIO","CAPITAL_ADEQUACY_RATIO"]){const result=await evaluate(code);expect(result?.reason).not.toBeUndefined();expect(result?.state,result?.reason).toBe("FRESH");expect(result?.lineage.sourceAdmissionPolicy).toBe(BANK_TWELVE_POLICY.id);expect(result?.lineage.executor).toBe(BANK_TWELVE_POLICY.executor)}
 })
 it("preserves UNKNOWN publication and limits source availability to the proven date",async()=>{
  const x=await prepareTwelveCapitalReview(now);expect(x.source.published_at).toBeNull();expect(x.reviews.every(r=>r.published_at===null)).toBe(true)
  const result=await evaluate("CET1_RATIO");expect(result?.observations[0]?.published_at).toBeNull();expect(result?.observations[0]?.proven_availability_at).toBe("2026-10-12T12:35:42.253Z")
 })
 it("excludes KVB, incorrect owners and unsupported valuation methods from this delegation",async()=>{
  const {reviews}=await prepareTwelveCapitalReview(now),r=reviews[0]!
  expect(approvedTwelveBankReview({...r,security_id:"be55b3cc-0400-45af-84aa-2a95e2c361c5"},BANK_TWELVE_POLICY.ownerId,"NUMERIC_SERIES")).toBe(false)
  expect(approvedTwelveBankReview(r,"another-owner","NUMERIC_SERIES")).toBe(false)
  expect(approvedTwelveBankReview({...r,requirement_code:"PB_RELATIVE"},BANK_TWELVE_POLICY.ownerId,"NUMERIC_SERIES")).toBe(false)
 })
 it("rejects unverified bytes, unapproved hosts and owner impersonation",async()=>{
  const {source,reviews}=await prepareTwelveCapitalReview(now),r=reviews[0]!
  for(const raw of [{...source.raw_payload,r2_verified_sha256:"0".repeat(64)},{...source.raw_payload,original_url:"https://evil.example/a.pdf"}])
   expect(approvedTwelveBankIssuerSource(r,{...source,raw_payload:raw},BANK_TWELVE_POLICY.ownerId,"NUMERIC_SERIES")).toBe(false)
  expect(approvedTwelveBankReview({...r,reviewed_by:BANK_TWELVE_POLICY.ownerId},BANK_TWELVE_POLICY.ownerId,"NUMERIC_SERIES")).toBe(false)
 })
 it("detects numeric tampering instead of trusting a qualified flag",async()=>{
  const result=await evaluate("CET1_RATIO",x=>{x.reviews[0]={...x.reviews[0]!,metadata:{...x.reviews[0]!.metadata,numeric_value:"99"}}})
  expect(result?.state).toBe("REVIEW_REQUIRED");expect(result?.reason).toBe("REVIEW_INTEGRITY_HASH_INVALID")
 })
 it("uses stable source/review identities for repeat attempts",async()=>{const a=await prepareTwelveCapitalReview(now),b=await prepareTwelveCapitalReview(now);expect(a).toEqual(b);expect(a.source.payload_hash).toBe(await bankValueHash(a.source.raw_payload))})
 it("preserves review integrity through PostgREST timestamp formatting",async()=>{
  const a=await prepareTwelveCapitalReview("2026-10-12T12:45:00.120Z")
  const b=await prepareTwelveCapitalReview("2026-10-12T12:45:00.12+00:00")
  expect(a).toEqual(b);expect(a.reviews[0]?.reviewed_at).toBe("2026-10-12T12:45:00.12+00:00")
  expect(a.reviews[0]?.fresh_through).toMatch(/\+00:00$/)
 })
 it("rejects other branches and manual unsigned callers",()=>{expect(twelveCapitalClaimsQualified({})).toBe(false);expect(twelveCapitalClaimsQualified({ref:"refs/heads/main"})).toBe(false)})
 it("accepts only the signed exact workflow identity",()=>{
  const claims={repository:"drddutta-portfolio/PortfiolioAI",repository_id:"1357024254",ref:"refs/heads/codex/banking-twelve-evidence",environment:"PortfolioAI-Development",
   sub:"repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development",workflow_ref:"drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-twelve-capital.yml@refs/heads/codex/banking-twelve-evidence",event_name:"workflow_dispatch",sha:"a".repeat(40)}
  expect(twelveCapitalClaimsQualified(claims)).toBe(true);expect(twelveCapitalClaimsQualified({...claims,event_name:"push"})).toBe(true)
  for(const patch of [{ref:"refs/heads/main"},{environment:"Production"},{repository_id:"other"},{event_name:"pull_request"},{workflow_ref:"wrong"}])expect(twelveCapitalClaimsQualified({...claims,...patch})).toBe(false)
 })
 it("rejects unpinned storage objects and excessive signature expiry",()=>{
  const u=`https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com/${BANK_TWELVE_POLICY.storageBucket}/${BANK_TWELVE_POLICY.storageKeyPrefix}${BANK_TWELVE_CAPITAL_MANIFEST.original_sha256}.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300`
  expect(twelveCapitalReadUrl(u)).toBe(true);expect(twelveCapitalReadUrl(u.replace("Expires=300","Expires=301"))).toBe(false)
  expect(twelveCapitalReadUrl(u.replace(BANK_TWELVE_CAPITAL_MANIFEST.original_sha256,"0".repeat(64)))).toBe(false)
  expect(twelveCapitalReadUrl(u.replace("portfolioai-history-dev","portfolioai-history-prod"))).toBe(false)
 })
})
