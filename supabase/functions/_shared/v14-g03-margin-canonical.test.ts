import {describe,it,expect} from 'vitest'
import {deriveG03Margin,G03_FINANCIAL_POLICY as p,G03_MARGIN_KIND,G03_MARGIN_SOURCE_KIND,type MarginComponents} from './v14-g03-margin-components.ts'
import {G03_MARGIN_BATCH as batch,approvedG03MarginReview,approvedG03MarginSource} from './v14-g03-margin-review.ts'
import {validateReviewedRequirementEvidence,reconcileCanonicalAndReviewed,type RequirementReview,type ReviewedSourceRecord} from './v14-reviewed-evidence.ts'
import {hashG02} from './v14-g02-source-import.ts'
import {planEvidenceRequirement} from './p7-ic-evidence-normalization.ts'
const at='2026-10-15T05:00:00+00:00'
async function fixture(){
 const sources:ReviewedSourceRecord[]=[],reviews:RequirementReview[]=[]
 for(const b of batch.periods){
  const derived=deriveG03Margin(b.components as MarginComponents)!
  const raw={version:G03_MARGIN_SOURCE_KIND,security_id:p.securityId,original_source_record_id:'parent:'+b.originalSha256,original_sha256:b.originalSha256,fragment:b.fragment,financial_components:b.components,verified_source_cells:batch.cells,provider_records:batch.providerRecords,profit_field:b.profitField,revenue_field:b.revenueField,caption_discrepancy:b.captionDiscrepancy,derivation:derived,authorization_reference:p.contractSha256,publication_precision:'UNKNOWN',proven_availability_at:at}
  const sourceHash=await hashG02(raw)
  sources.push({id:b.sourceId,source_code:'TRENDLYNE_MCP',retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw})
  const payload={portfolio_id:p.portfolioId,security_id:p.securityId,requirement_code:'OPERATING_MARGIN_HISTORY',review_kind:G03_MARGIN_KIND,decision:'SUPPORTS',source_record_id:b.sourceId,research_document_id:b.originalSha256,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.periodStart,period_end:b.periodEnd,period_type:'QUARTER',unit:'PERCENT',currency:null,consolidation_scope:'CONSOLIDATED',published_at:null,retrieved_at:at,fresh_through:'2026-11-27T00:00:00+00:00',review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:at,supersedes_review_id:null,metadata:{financial_components:b.components,derivation:derived,review_authorization:{authorization_reference:p.contractSha256,authorizing_owner_id:p.ownerId,executor:'GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION'}}}
  reviews.push({id:b.reviewId,...payload,review_hash:await hashG02(payload)})
 }
 const hashes=[...new Set(batch.periods.map(x=>x.originalSha256))]
 return {portfolioId:p.portfolioId,portfolioOwnerId:p.ownerId,securityId:p.securityId,requirementCode:'OPERATING_MARGIN_HISTORY',family:planEvidenceRequirement('OPERATING_MARGIN_HISTORY',8,'DEFENCE_AEROSPACE').deterministicCoverageRule,metricCodes:['OPERATING_MARGIN_HISTORY'],minimum:8,reviews,sources,documents:hashes.map(h=>({id:h,security_id:p.securityId,reporting_period_start:null,reporting_period_end:null,reporting_period_type:null,published_at:null,canonical_content_hash:h,identity_status:'VERIFIED'})),documentSources:hashes.map(h=>({id:'link:'+h,research_document_id:h,source_record_id:'parent:'+h,source_code:p.sourceAuthority,content_hash:h,source_status:'VERIFIED',provider_document_id:null,source_url:'https://official.example/report.pdf',retrieved_at:at})),definitions:[],evaluationAsOfMs:Date.parse(at),sourceCutoffAtMs:Date.parse(at),freshnessPolicy:'SOURCE_APPROPRIATE_150_DAYS_UNLESS_LONG_LIVED'}
}

describe('BEL eight original-bound quarterly raw operating pairs',()=>{
 it('uses the established Decimal margin owner, preserving both raw amounts and consolidation scope',async()=>{
  const f=await fixture(),r=await validateReviewedRequirementEvidence(f)
  expect(f.family).toBe('NUMERIC_SERIES');expect(r).toMatchObject({state:'FRESH',reason:'APPROVED_SOURCE_BOUND_MARGIN_PAIR_SERIES_READY',lineage:{calculationAuthority:'derivePharmaOperatingMarginPercent',scope:'CONSOLIDATED',historicalPitAvailabilityNotClaimed:true}})
  expect(r?.observations).toHaveLength(8);expect(r?.observations.map(x=>x.period_end)).toEqual(batch.periods.map(b=>b.periodEnd))
  expect(deriveG03Margin(batch.periods[7].components as MarginComponents)).toMatchObject({operatingProfit:'1388.40',operatingRevenue:'5546.98',marginPercent:'25.029836',issuerReportedPercentage:false})
  expect(await validateReviewedRequirementEvidence({...f,reviews:f.reviews.slice(1)})).toMatchObject({state:'INSUFFICIENT'})
  expect(await validateReviewedRequirementEvidence({...f,minimum:1})).toMatchObject({state:'INSUFFICIENT'})
 })
 it('rejects incompatible scope, amounts, units, annual/invalid dates and zero revenue; preserves genuine negative profit',()=>{
  const c=batch.periods[0].components as MarginComponents
  for(const change of [{revenue:'0'},{profit:'NaN'},{profit:'-'},{currency:'USD'},{scope:'STANDALONE'},{unit:'PERCENT'},{profitDefinition:'EBITDA'},{periodEnd:'2024-09-31'},{periodStart:'2024-01-01'}])expect(deriveG03Margin({...c,...change})).toBeNull()
  expect(deriveG03Margin({...c,profit:'-1',revenue:'100'})).toMatchObject({marginPercent:'-1'})
 })
 it('preserves the Q5 display discrepancy and fails source, owner, original and parameter tampering',async()=>{
  const f=await fixture(),r=f.reviews[0],s=f.sources[0]
  expect(batch.periods.find(b=>b.profitField.parameterToken==='opqmq5')?.captionDiscrepancy).toBeTruthy()
  for(const change of [{reviewed_by:p.ownerId},{portfolio_id:'other'},{consolidation_scope:'STANDALONE'},{period_end:'2024-12-31'}])expect(approvedG03MarginReview({...r,...change},p.ownerId,'NUMERIC_SERIES')).toBe(false)
  for(const change of [{source_code:'COMPANY_EXCHANGE_FILING'},{raw_payload:{...s.raw_payload,provider_records:[]}},{raw_payload:{...s.raw_payload,profit_field:{}}},{raw_payload:{...s.raw_payload,original_sha256:'0'.repeat(64)}}])expect(approvedG03MarginSource(r,{...s,...change})).toBe(false)
  expect(await validateReviewedRequirementEvidence({...f,sources:[{...s,raw_payload:{...s.raw_payload,fragment:'modified'}},...f.sources.slice(1)]})).toMatchObject({state:'REVIEW_REQUIRED'})
  expect(await validateReviewedRequirementEvidence({...f,evaluationAsOfMs:Date.parse('2026-11-28'),sourceCutoffAtMs:Date.parse('2026-11-28')})).toMatchObject({state:'STALE'})
 })
 it('excludes only the pinned undated UNKNOWN-scope TTM candidate, preserving changed or conflicting canonical observations',async()=>{
  const f=await fixture(),r=await validateReviewedRequirementEvidence(f)
  const legacy={...r!.observations[0],id:'c5c302f8-c8c5-4fd8-8cd9-7bf23f0eeddb',source_record_id:'cf472a75-1d5d-4045-b3c0-f7cc36f10d8d',metric_code:'OPM_TTM',numeric_value:'28.550000000000000000',period_start:null,period_end:null,period_type:'TTM',consolidation_scope:'UNKNOWN'}
  const args={canonicalRows:[legacy],reviewed:r,definitions:[],minimum:8,evaluationAsOfMs:f.evaluationAsOfMs,sourceCutoffAtMs:f.sourceCutoffAtMs,family:f.family}
  expect(reconcileCanonicalAndReviewed(args)).toMatchObject({authority:'REVIEW',validation:{state:'FRESH'},reason:'APPROVED_MARGIN_PAIRS_SELECTED_UNDATED_TTM_RETAINED'})
  expect(reconcileCanonicalAndReviewed({...args,canonicalRows:[{...legacy,numeric_value:'29'}]})).toMatchObject({authority:'CANONICAL'})
  expect(reconcileCanonicalAndReviewed({...args,canonicalRows:[legacy,{...legacy,id:'other'}]})).toMatchObject({authority:'CANONICAL'})
 })
})
