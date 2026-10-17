import {describe,it,expect} from "vitest"
import {prepareTwelveGrowthReviews,BANK_TWELVE_GROWTH_MANIFEST,twelveGrowthClaimsQualified,twelveGrowthReadUrl} from "./v14-bank-twelve-growth-review.ts"
import {BANK_TWELVE_POLICY} from "./v14-bank-twelve-delegation.ts"
import {BANK_DELEGATION_POLICY} from "./v14-bank-approved-delegation.ts"
import {validateReviewedRequirementEvidence} from "./v14-reviewed-evidence.ts"
import type {MetricDefinition} from "./p7-ic-input-validation.ts"
const now="2026-10-12T13:00:00Z"
const definitions:MetricDefinition[]=["ADVANCES_GROWTH_YOY","DEPOSITS_GROWTH_YOY"].map(code=>({code,canonical_unit:"PERCENT",value_kind:"NUMERIC",is_active:true,freshness_seconds:10368000,definition:{provider:"COMPANY_EXCHANGE_FILING",selection:"REVIEWED",period_type:"QUARTER"}}))
describe("fixed twelve-bank source-reported current growth",()=>{
 it("qualifies four literal original facts through existing approved canonical reviewer",async()=>{
  for(const pin of BANK_TWELVE_GROWTH_MANIFEST.sources){const p=await prepareTwelveGrowthReviews(pin.symbol,now)
   for(const r of p.reviews){const out=await validateReviewedRequirementEvidence({portfolioId:BANK_DELEGATION_POLICY.portfolioId,portfolioOwnerId:BANK_DELEGATION_POLICY.ownerId,
    securityId:pin.security_id,requirementCode:r.requirement_code,family:"NUMERIC_SERIES",metricCodes:[r.requirement_code],minimum:1,reviews:p.reviews,sources:[p.source],documents:[],documentSources:[],definitions,evaluationAsOfMs:Date.parse(now),sourceCutoffAtMs:Date.parse(now),freshnessPolicy:null})
    expect(out?.state,out?.reason).toBe("FRESH")
   }
  }
 })
 it("preserves exact original values and never computes loan/average proxies",async()=>{
  const a=await prepareTwelveGrowthReviews("BANKBARODA",now),b=await prepareTwelveGrowthReviews("BANDHANBNK",now)
  expect(a.reviews.map(r=>r.metadata.numeric_value)).toEqual(["17.4","13.8"])
  expect(b.reviews.map(r=>r.metadata.numeric_value)).toEqual(["16.4","6.6"])
  expect(a.reviews.every(r=>r.reviewed_by===null&&r.period_start===null)).toBe(true)
 })
 it("rejects KVB, unpinned banks and backdated verification",async()=>{
  for(const symbol of ["KARURVYSYA","AXISBANK"]){await expect(prepareTwelveGrowthReviews(symbol,now)).rejects.toThrow("SCOPE_INVALID")}
  await expect(prepareTwelveGrowthReviews("BANKBARODA","2020-01-01T00:00:00Z")).rejects.toThrow("TIME_INVALID")
 })
 it("keeps deterministic identities and timestamp representation across repeat requests",async()=>{
  expect(await prepareTwelveGrowthReviews("BANKBARODA",now)).toEqual(await prepareTwelveGrowthReviews("BANKBARODA","2026-10-12T13:00:00+00:00"))
 })
 it("rejects wrong workflow, branch and unsigned executor claims",()=>{
  const c={repository:"drddutta-portfolio/PortfiolioAI",repository_id:"1357024254",ref:"refs/heads/codex/banking-twelve-evidence",environment:"PortfolioAI-Development",sub:"repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development",workflow_ref:"drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-twelve-growth.yml@refs/heads/codex/banking-twelve-evidence",event_name:"workflow_dispatch",sha:"a".repeat(40)}
  expect(twelveGrowthClaimsQualified(c)).toBe(true)
  for(const p of [{ref:"refs/heads/main"},{workflow_ref:"capital"},{event_name:"pull_request"},{environment:"Production"}])expect(twelveGrowthClaimsQualified({...c,...p})).toBe(false)
  expect(twelveGrowthClaimsQualified({})).toBe(false)
 })
 it("binds short-lived read URLs to exact original and Development bucket",()=>{
  const p=BANK_TWELVE_GROWTH_MANIFEST.sources[0]!
  const u=`https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com/${BANK_TWELVE_POLICY.storageBucket}/${BANK_TWELVE_POLICY.storageKeyPrefix}${p.original_sha256}.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300`
  expect(twelveGrowthReadUrl(p.symbol,u)).toBe(true)
  for(const v of [u.replace("Expires=300","Expires=301"),u.replace(p.original_sha256,"0".repeat(64)),u.replace("portfolioai-history-dev","portfolioai-history-prod")])expect(twelveGrowthReadUrl(p.symbol,v)).toBe(false)
  expect(twelveGrowthReadUrl("KARURVYSYA",u)).toBe(false)
 })
})
