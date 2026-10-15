import {describe,it,expect} from 'vitest'
import {deriveG03CashConversion,G03_FINANCIAL_POLICY as p,G03_CASH_KIND,G03_CASH_SOURCE_KIND,type CashComponents} from './v14-g03-cash-components.ts'
import {G03_CASH_BATCH as batch,approvedG03CashReview,approvedG03CashSource} from './v14-g03-cash-review.ts'
import {validateReviewedRequirementEvidence,reconcileCanonicalAndReviewed,type RequirementReview,type ReviewedSourceRecord} from './v14-reviewed-evidence.ts'
import {hashG02} from './v14-g02-source-import.ts'
import {g03FinancialExecutorQualified} from './v14-g03-executor-identity.ts'
const at='2026-10-15T05:00:00+00:00'
async function fixture(){
 const sources:ReviewedSourceRecord[]=[],reviews:RequirementReview[]=[]
 for(const b of batch.periods){
  const derived=deriveG03CashConversion(b.components as CashComponents)!
  const raw={version:G03_CASH_SOURCE_KIND,security_id:p.securityId,original_source_record_id:'parent:'+b.originalSha256,original_sha256:b.originalSha256,fragment:b.fragment,financial_components:b.components,verified_source_cells:batch.cells.filter(c=>c.originalSha256===b.originalSha256),derivation:derived,authorization_reference:p.contractSha256,publication_precision:'UNKNOWN',proven_availability_at:at}
  const sourceHash=await hashG02(raw)
  sources.push({id:b.sourceId,source_code:p.sourceAuthority,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw})
  const payload={portfolio_id:p.portfolioId,security_id:p.securityId,requirement_code:'CFO_FCF_CONVERSION',review_kind:G03_CASH_KIND,decision:'SUPPORTS',source_record_id:b.sourceId,research_document_id:b.originalSha256,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.periodStart,period_end:b.periodEnd,period_type:'YEAR',unit:'RATIO',currency:null,consolidation_scope:'STANDALONE',published_at:null,retrieved_at:at,fresh_through:'2027-03-31T00:00:00+00:00',review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:at,supersedes_review_id:null,metadata:{financial_components:b.components,derivation:derived,review_authorization:{authorization_reference:p.contractSha256,authorizing_owner_id:p.ownerId,executor:'GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION'}}}
  reviews.push({id:b.reviewId,...payload,review_hash:await hashG02(payload)})
 }
 const hashes=[...new Set(batch.periods.map(x=>x.originalSha256))]
 return {portfolioId:p.portfolioId,portfolioOwnerId:p.ownerId,securityId:p.securityId,requirementCode:'CFO_FCF_CONVERSION',family:'NUMERIC_SERIES' as const,metricCodes:['CFO_FCF_CONVERSION'],minimum:3,reviews,sources,documents:hashes.map(h=>({id:h,security_id:p.securityId,reporting_period_start:null,reporting_period_end:null,reporting_period_type:null,published_at:null,canonical_content_hash:h,identity_status:'VERIFIED'})),documentSources:hashes.map(h=>({id:'link:'+h,research_document_id:h,source_record_id:'parent:'+h,source_code:p.sourceAuthority,content_hash:h,source_status:'VERIFIED',provider_document_id:null,source_url:'https://official.example/report.pdf',retrieved_at:at})),definitions:[],evaluationAsOfMs:Date.parse(at),sourceCutoffAtMs:Date.parse(at),freshnessPolicy:'SOURCE_APPROPRIATE_150_DAYS_UNLESS_LONG_LIVED'}
}
describe('approved BEL matched annual cash components in the canonical reviewer',()=>{
 it('derives the exact three-year conversion and preserves adverse FCF and original classification',()=>{
  expect(batch.periods.map(b=>deriveG03CashConversion(b.components as CashComponents))).toEqual([
   expect.objectContaining({cfoCrore:'4626.43',cashCapexCrore:'647.14',patCrore:'4020.00',fcfCrore:'3979.29',cfoPat:'1.150853',adjustmentKind:'PORTFOLIOAI_CLASSIFICATION_NORMALIZATION',issuerReportedRestatement:false}),
   expect.objectContaining({cfoCrore:'457.25',cashCapexCrore:'1004.07',patCrore:'5288.25',fcfCrore:'-546.82',cfoPat:'0.086465'}),
   expect.objectContaining({cfoCrore:'1494.34',cashCapexCrore:'983.12',patCrore:'6048.48',fcfCrore:'511.22',cfoPat:'0.247060'}),
  ])
 })
 it('rejects missing/invalid/nonpositive denominators and an unapproved component basis',()=>{
  const b=batch.periods[0].components as CashComponents
  for(const change of [{pat:'0'},{pat:'-1'},{pat:''},{pat:'NaN'},{cashCapexOutflow:'64714'},{scope:'CONSOLIDATED'},{unit:'INR_CRORE'},{classification:'UNREVIEWED'},{adjustmentKind:'ISSUER_REPORTED' as const}])expect(deriveG03CashConversion({...b,...change})).toBeNull()
  expect(deriveG03CashConversion({...b,cfoOriginal:'-100',excludedRental:'0',excludedMutualFundGain:'0',adjustmentKind:'ISSUER_REPORTED'})).toMatchObject({cfoCrore:'-1.00',fcfCrore:'-648.14'})
  expect(deriveG03CashConversion({...b,cfoOriginal:'1',pat:'128',cashCapexOutflow:'0',excludedRental:'0',excludedMutualFundGain:'0',adjustmentKind:'ISSUER_REPORTED'})).toMatchObject({cfoPat:'0.007813'})
 })
 it('admits three matched periods without activating generic provider CFO or forging source publication',async()=>{
  const f=await fixture(),r=await validateReviewedRequirementEvidence(f)
  expect(r).toMatchObject({state:'FRESH',reason:'APPROVED_SOURCE_BOUND_CASH_COMPONENT_SERIES_READY',lineage:{financialContract:p.version,providerCfoRegistryUnchanged:true,historicalPitAvailabilityNotClaimed:true}})
  expect(r?.observations.map(x=>[x.period_end,x.numeric_value,x.published_at])).toEqual([['2024-03-31','1.150853',null],['2025-03-31','0.086465',null],['2026-03-31','0.247060',null]])
  expect(reconcileCanonicalAndReviewed({canonicalRows:[],reviewed:r,definitions:[],minimum:3,evaluationAsOfMs:f.evaluationAsOfMs,sourceCutoffAtMs:f.sourceCutoffAtMs,family:f.family})).toMatchObject({authority:'REVIEW',validation:{state:'FRESH'}})
  expect(await validateReviewedRequirementEvidence({...f,reviews:f.reviews.slice(1)})).toMatchObject({state:'INSUFFICIENT',reason:'CASH_COMPONENT_THREE_MATCHED_PERIODS_REQUIRED'})
  expect(await validateReviewedRequirementEvidence({...f,minimum:1})).toMatchObject({state:'INSUFFICIENT'})
 })
 it('rejects foreign identity, component mixing, changed originals, omitted cells and false attribution',async()=>{
  const f=await fixture(),r=f.reviews[0],s=f.sources[0]
  expect(approvedG03CashReview(r,p.ownerId,'NUMERIC_SERIES')).toBe(true)
  for(const change of [{security_id:'foreign'},{portfolio_id:'foreign'},{reviewed_by:p.ownerId},{period_end:'2025-03-31'},{consolidation_scope:'CONSOLIDATED'},{unit:'INR_CRORE'},{metadata:{...r.metadata,financial_components:{...batch.periods[0].components,pat:'1'}}}])expect(approvedG03CashReview({...r,...change},p.ownerId,'NUMERIC_SERIES')).toBe(false)
  for(const change of [{source_code:'TRENDLYNE_MCP'},{raw_payload:{...s.raw_payload,original_sha256:'0'.repeat(64)}},{raw_payload:{...s.raw_payload,verified_source_cells:[]}},{raw_payload:{...s.raw_payload,publication_precision:'EXACT'}}])expect(approvedG03CashSource(r,{...s,...change})).toBe(false)
  expect(await validateReviewedRequirementEvidence({...f,portfolioOwnerId:'foreign'})).toMatchObject({state:'REVIEW_REQUIRED'})
  expect(await validateReviewedRequirementEvidence({...f,documents:f.documents.map(d=>({...d,canonical_content_hash:'a'.repeat(64)}))})).toMatchObject({state:'REVIEW_REQUIRED'})
  expect(await validateReviewedRequirementEvidence({...f,documentSources:f.documentSources.concat(f.documentSources)})).toMatchObject({state:'REVIEW_REQUIRED',reason:'DOCUMENT_SOURCE_ASSOCIATION_NOT_UNIQUE'})
 })
 it('checks review/source integrity, reporting age and cutoff independently of admission',async()=>{
  const f=await fixture()
  expect(await validateReviewedRequirementEvidence({...f,reviews:[{...f.reviews[0],review_hash:'0'.repeat(64)},...f.reviews.slice(1)]})).toMatchObject({state:'REVIEW_REQUIRED',reason:'REVIEW_INTEGRITY_HASH_INVALID'})
  expect(await validateReviewedRequirementEvidence({...f,sources:[{...f.sources[0],raw_payload:{...f.sources[0].raw_payload,extra:'modified'}},...f.sources.slice(1)]})).toMatchObject({state:'REVIEW_REQUIRED',reason:'CASH_COMPONENT_SOURCE_INTEGRITY_INVALID'})
  expect(await validateReviewedRequirementEvidence({...f,evaluationAsOfMs:Date.parse('2027-04-01T00:00:00Z'),sourceCutoffAtMs:Date.parse('2027-04-01T00:00:00Z')})).toMatchObject({state:'STALE'})
  expect(await validateReviewedRequirementEvidence({...f,evaluationAsOfMs:Date.parse('2026-10-14T00:00:00Z'),sourceCutoffAtMs:Date.parse('2026-10-14T00:00:00Z')})).toMatchObject({state:'REVIEW_REQUIRED',reason:'REVIEW_CREATED_AFTER_SOURCE_CUTOFF'})
 })
 it('isolates the protected dispatched workflow and rejects provider/grant/production identities',()=>{
  const claims={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',event_name:'workflow_dispatch',workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/g03-bel-cash-components.yml@refs/heads/codex/g02-industry-evidence'}
  expect(g03FinancialExecutorQualified(claims)).toBe(true)
  for(const change of [{event_name:'push'},{environment:'Production'},{ref:'refs/heads/main'},{workflow_ref:claims.workflow_ref.replace('cash-components','order-history')}])expect(g03FinancialExecutorQualified({...claims,...change})).toBe(false)
 })
})
