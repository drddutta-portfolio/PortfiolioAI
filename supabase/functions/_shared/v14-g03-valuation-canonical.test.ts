import {describe,it,expect} from 'vitest'
import {deriveG03Valuation,G03_FINANCIAL_POLICY as p,G03_VALUATION_KIND,G03_VALUATION_SOURCE_KIND,type ValuationComponents} from './v14-g03-valuation-components.ts'
import {G03_VALUATION_BATCH as batch,approvedG03ValuationReview,approvedG03ValuationSource} from './v14-g03-valuation-review.ts'
import {validateReviewedRequirementEvidence,reconcileCanonicalAndReviewed,type RequirementReview,type ReviewedSourceRecord} from './v14-reviewed-evidence.ts'
import {hashG02} from './v14-g02-source-import.ts'
import {planEvidenceRequirement} from './p7-ic-evidence-normalization.ts'
const at='2026-10-15T15:00:00+00:00'
async function fixture(){
 const sources:ReviewedSourceRecord[]=[],reviews:RequirementReview[]=[]
 for(const b of batch.periods){
  const derived=deriveG03Valuation(b.components as ValuationComponents)!
  const raw={version:G03_VALUATION_SOURCE_KIND,security_id:p.securityId,original_source_record_id:'parent:'+b.originalSha256,original_sha256:b.originalSha256,fragment:b.fragment,financial_components:b.components,verified_source_cells:batch.cells,availability_proofs:batch.availability,registered_originals:batch.registeredOriginals,retained_captures:batch.retainedCaptures,share_source_sha256:b.shareSourceSha256,price_source_id:b.priceSourceId,derivation:derived,authorization_reference:p.contractSha256,publication_precision:'UNKNOWN',proven_availability_at:at}
  const sourceHash=await hashG02(raw)
  sources.push({id:b.sourceId,source_code:p.sourceAuthority,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw})
  const payload={portfolio_id:p.portfolioId,security_id:p.securityId,requirement_code:'VALUATION',review_kind:G03_VALUATION_KIND,decision:'SUPPORTS',source_record_id:b.sourceId,research_document_id:b.originalSha256,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.periodStart,period_end:b.periodEnd,period_type:'POINT_IN_TIME',unit:'COMPOSITE_VALUATION',currency:null,consolidation_scope:'STANDALONE',published_at:null,retrieved_at:at,fresh_through:'2026-10-15T23:59:59+05:30',review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:at,supersedes_review_id:null,metadata:{financial_components:b.components,derivation:derived,review_authorization:{authorization_reference:p.contractSha256,authorizing_owner_id:p.ownerId,executor:'GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION'}}}
  reviews.push({id:b.reviewId,...payload,review_hash:await hashG02(payload)})
 }
 const hashes=[...new Set(batch.periods.map(x=>x.originalSha256))]
 return {portfolioId:p.portfolioId,portfolioOwnerId:p.ownerId,securityId:p.securityId,requirementCode:'VALUATION',family:planEvidenceRequirement('VALUATION',3,'DEFENCE_AEROSPACE').deterministicCoverageRule,metricCodes:['VALUATION'],minimum:3,reviews,sources,documents:hashes.map(h=>({id:h,security_id:p.securityId,reporting_period_start:null,reporting_period_end:null,reporting_period_type:null,published_at:null,canonical_content_hash:h,identity_status:'VERIFIED'})),documentSources:hashes.map(h=>({id:'link:'+h,research_document_id:h,source_record_id:'parent:'+h,source_code:p.sourceAuthority,content_hash:h,source_status:'VERIFIED',provider_document_id:null,source_url:'https://official.example/report.pdf',retrieved_at:at})),definitions:[],evaluationAsOfMs:Date.parse(at),sourceCutoffAtMs:Date.parse(at),freshnessPolicy:'SOURCE_APPROPRIATE_150_DAYS_UNLESS_LONG_LIVED'}
}

describe('BEL defence valuation requires three complete source-bound dated joins',()=>{
 it('admits all three metrics for three distinct dates under the actual defence planner, without BANK histories or score weights',async()=>{
  const f=await fixture(),r=await validateReviewedRequirementEvidence(f)
  expect(f.family).toBe('NUMERIC_SERIES');expect(r).toMatchObject({state:'FRESH',reason:'APPROVED_SOURCE_BOUND_DATED_VALUATIONS_READY',lineage:{allThreeMetricsPerDate:true,financialPitAvailabilityQualified:true,bankHistoricalContractNotApplied:true}})
  expect(r?.observations).toHaveLength(3);expect(r?.observations.map(x=>x.date_value)).toEqual(['2026-10-13','2026-10-14','2026-10-15'])
  expect(deriveG03Valuation(batch.periods[0].components as ValuationComponents)).toMatchObject({ttmPatLakh:'612768',ttmOperatingEbitdaLakh:'816456',marketCapCrore:'277771.595502000',enterpriseValueCrore:'277837.055502000',qualifiedAnnualFcfCrore:'511.22',exactShares:'7309778829',issuerReportedRatios:false,forecastsUsed:false})
  expect(reconcileCanonicalAndReviewed({canonicalRows:[],reviewed:r,definitions:[],minimum:3,evaluationAsOfMs:f.evaluationAsOfMs,sourceCutoffAtMs:f.sourceCutoffAtMs,family:f.family})).toMatchObject({authority:'REVIEW',validation:{state:'FRESH'}})
  expect(await validateReviewedRequirementEvidence({...f,reviews:f.reviews.slice(1)})).toMatchObject({state:'INSUFFICIENT'})
 })
 it('blocks lookahead, undefined denominators, incompatible scope, total-return prices and missing components; negative FCF remains negative evidence',()=>{
  const c=batch.periods[0].components as ValuationComponents
  for(const change of [{price:'0'},{shares:'0'},{shares:'7309778829.4'},{annualPat:'0',currentJunePat:'0'},{annualOperatingEbitda:'0',currentJuneOperatingEbitda:'0'},{scope:'CONSOLIDATED'},{priceBasis:'TOTAL_RETURN_INDEX'},{amountUnit:'INR_CRORE'},{annualCashCapex:''},{financialAvailabilityAt:'2026-10-14T10:00:00Z'},{shareAvailabilityAt:'2026-10-14T10:00:00Z'},{valuationDate:'2026-10-32'}])expect(deriveG03Valuation({...c,...change})).toBeNull()
  expect(Number(deriveG03Valuation({...c,annualCfo:'-1'})?.fcfYieldPercent)).toBeLessThan(0)
 })
 it('preserves UNKNOWN ledger publication while requiring independently bound original availability and rejecting substituted source/capital proofs',async()=>{
  const f=await fixture(),r=f.reviews[0],s=f.sources[0]
  expect(r.published_at).toBeNull();expect(s.published_at).toBeNull()
  for(const change of [{portfolio_id:'other'},{reviewed_by:p.ownerId},{unit:'RATIO'},{period_type:'TTM'}])expect(approvedG03ValuationReview({...r,...change},p.ownerId,'NUMERIC_SERIES')).toBe(false)
  for(const change of [{raw_payload:{...s.raw_payload,availability_proofs:[]}},{raw_payload:{...s.raw_payload,retained_captures:[]}},{raw_payload:{...s.raw_payload,registered_originals:[]}},{raw_payload:{...s.raw_payload,share_source_sha256:'0'.repeat(64)}}])expect(approvedG03ValuationSource(r,{...s,...change})).toBe(false)
  expect(await validateReviewedRequirementEvidence({...f,evaluationAsOfMs:Date.parse('2026-10-16T00:00:00Z'),sourceCutoffAtMs:Date.parse('2026-10-16T00:00:00Z')})).toMatchObject({state:'STALE'})
 })
})
