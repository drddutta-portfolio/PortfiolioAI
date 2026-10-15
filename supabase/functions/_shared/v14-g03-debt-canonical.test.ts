import {describe,it,expect} from 'vitest'
import {deriveG03DebtCoverage,G03_FINANCIAL_POLICY as p,G03_DEBT_KIND,G03_DEBT_SOURCE_KIND,type DebtComponents} from './v14-g03-debt-components.ts'
import {G03_DEBT_BATCH as batch,approvedG03DebtReview,approvedG03DebtSource} from './v14-g03-debt-review.ts'
import {validateReviewedRequirementEvidence,reconcileCanonicalAndReviewed,type RequirementReview,type ReviewedSourceRecord} from './v14-reviewed-evidence.ts'
import {hashG02} from './v14-g02-source-import.ts'
import {planEvidenceRequirement} from './p7-ic-evidence-normalization.ts'
const at='2026-10-15T05:00:00+00:00'
async function fixture(){
 const sources:ReviewedSourceRecord[]=[],reviews:RequirementReview[]=[]
 for(const b of batch.periods){
  const derived=deriveG03DebtCoverage(b.components as DebtComponents)!
  const raw={version:G03_DEBT_SOURCE_KIND,security_id:p.securityId,original_source_record_id:'parent:'+b.originalSha256,original_sha256:b.originalSha256,xml_original_sha256:b.xmlOriginalSha256,fragment:b.fragment,financial_components:b.components,verified_source_cells:batch.cells,derivation:derived,authorization_reference:p.contractSha256,publication_precision:'UNKNOWN',proven_availability_at:at}
  const sourceHash=await hashG02(raw)
  sources.push({id:b.sourceId,source_code:p.sourceAuthority,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw})
  const payload={portfolio_id:p.portfolioId,security_id:p.securityId,requirement_code:'NET_DEBT_AND_INTEREST_COVERAGE',review_kind:G03_DEBT_KIND,decision:'SUPPORTS',source_record_id:b.sourceId,research_document_id:b.originalSha256,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.periodStart,period_end:b.periodEnd,period_type:'YEAR',unit:'RATIO',currency:null,consolidation_scope:'STANDALONE',published_at:null,retrieved_at:at,fresh_through:'2027-03-31T00:00:00+00:00',review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:at,supersedes_review_id:null,metadata:{financial_components:b.components,derivation:derived,review_authorization:{authorization_reference:p.contractSha256,authorizing_owner_id:p.ownerId,executor:'GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION'}}}
  reviews.push({id:b.reviewId,...payload,review_hash:await hashG02(payload)})
 }
 const hashes=[...new Set(batch.periods.map(x=>x.originalSha256))]
 return {portfolioId:p.portfolioId,portfolioOwnerId:p.ownerId,securityId:p.securityId,requirementCode:'NET_DEBT_AND_INTEREST_COVERAGE',family:planEvidenceRequirement('NET_DEBT_AND_INTEREST_COVERAGE',3,'DEFENCE_AEROSPACE').deterministicCoverageRule,metricCodes:['NET_DEBT_AND_INTEREST_COVERAGE'],minimum:3,reviews,sources,documents:hashes.map(h=>({id:h,security_id:p.securityId,reporting_period_start:null,reporting_period_end:null,reporting_period_type:null,published_at:null,canonical_content_hash:h,identity_status:'VERIFIED'})),documentSources:hashes.map(h=>({id:'link:'+h,research_document_id:h,source_record_id:'parent:'+h,source_code:p.sourceAuthority,content_hash:h,source_status:'VERIFIED',provider_document_id:null,source_url:'https://official.example/report.pdf',retrieved_at:at})),definitions:[],evaluationAsOfMs:Date.parse(at),sourceCutoffAtMs:Date.parse(at),freshnessPolicy:'SOURCE_APPROPRIATE_150_DAYS_UNLESS_LONG_LIVED'}
}
describe('BEL approved debt/coverage requires every matched annual component',()=>{
 it('includes lease debt and interest, excludes pledged cash, and uses consistent issuer operating EBIT',()=>{
  const r=batch.periods.map(b=>deriveG03DebtCoverage(b.components as DebtComponents))
  expect(r).toEqual([
   expect.objectContaining({grossDebtCrore:'62.51',verifiedUnpledgedCashCrore:'0.01',netDebtCrore:'62.50',operatingEbitdaCrore:'4998.17',operatingEbitCrore:'4585.74',financeCostsCrore:'7.02',leaseInterestCrore:'4.21'}),
   expect.objectContaining({grossDebtCrore:'61.23',verifiedUnpledgedCashCrore:'0.01',netDebtCrore:'61.22',operatingEbitdaCrore:'6767.59',operatingEbitCrore:'6332.01',financeCostsCrore:'9.61',leaseInterestCrore:'4.16'}),
   expect.objectContaining({grossDebtCrore:'65.46',verifiedUnpledgedCashCrore:'0.00',netDebtCrore:'65.46',operatingEbitdaCrore:'8015.30',operatingEbitCrore:'7491.37',financeCostsCrore:'6.72',leaseInterestCrore:'4.25'}),
  ])
  expect(r.every(x=>x?.includesLeaseDebtAndInterest&&x.issuerReportedRatio===false)).toBe(true)
 })
 it('rejects missing/zero denominators, scope mixing, total-income EBIT and impossible cash or lease reconciliations',()=>{
  const c=batch.periods[0].components as DebtComponents
  for(const change of [{borrowingCurrent:''},{borrowingCurrent:'-'},{borrowingCurrent:'debt-free'},{financeCosts:'0'},{financeCosts:'NaN'},{issuerOperatingEbitda:'0'},{pledgedCashEquivalents:'999999'},{leaseInterest:'999999'},{scope:'CONSOLIDATED'},{unit:'INR_CRORE'},{ebitdaBasis:'TOTAL_INCOME_INCLUDING_OTHER_INCOME'},{profitBeforeTax:'534158'}])expect(deriveG03DebtCoverage({...c,...change})).toBeNull()
 })
 it('passes the actual canonical planner only with all three complete, immutable and independently bound annual reviews',async()=>{
  const f=await fixture(),result=await validateReviewedRequirementEvidence(f)
  expect(f.family).toBe('NUMERIC_SERIES');expect(result).toMatchObject({state:'FRESH',reason:'APPROVED_SOURCE_BOUND_DEBT_COMPONENT_SERIES_READY',lineage:{includesLeaseDebtAndInterest:true,pledgedCashExcluded:true,historicalPitAvailabilityNotClaimed:true}})
  expect(result?.observations.map(x=>x.period_end)).toEqual(['2024-03-31','2025-03-31','2026-03-31'])
  expect(reconcileCanonicalAndReviewed({canonicalRows:[],reviewed:result,definitions:[],minimum:3,evaluationAsOfMs:f.evaluationAsOfMs,sourceCutoffAtMs:f.sourceCutoffAtMs,family:f.family})).toMatchObject({authority:'REVIEW',validation:{state:'FRESH'}})
  expect(await validateReviewedRequirementEvidence({...f,reviews:f.reviews.slice(1)})).toMatchObject({state:'INSUFFICIENT'})
  expect(await validateReviewedRequirementEvidence({...f,minimum:1})).toMatchObject({state:'INSUFFICIENT'})
 })
 it('rejects changed source cells, borrowed owner identity, accounting scope, foreign portfolios and false publication',async()=>{
  const f=await fixture(),r=f.reviews[0],s=f.sources[0]
  expect(approvedG03DebtReview(r,p.ownerId,'NUMERIC_SERIES')).toBe(true)
  for(const change of [{security_id:'foreign'},{portfolio_id:'foreign'},{reviewed_by:p.ownerId},{period_end:'2025-03-31'},{consolidation_scope:'CONSOLIDATED'},{metadata:{...r.metadata,financial_components:{...batch.periods[0].components,leaseCurrent:'0'}}}])expect(approvedG03DebtReview({...r,...change},p.ownerId,'NUMERIC_SERIES')).toBe(false)
  for(const change of [{source_code:'TRENDLYNE_MCP'},{raw_payload:{...s.raw_payload,xml_original_sha256:'0'.repeat(64)}},{raw_payload:{...s.raw_payload,verified_source_cells:[]}},{raw_payload:{...s.raw_payload,publication_precision:'EXACT'}}])expect(approvedG03DebtSource(r,{...s,...change})).toBe(false)
  expect(await validateReviewedRequirementEvidence({...f,sources:[{...s,raw_payload:{...s.raw_payload,fragment:'changed'}},...f.sources.slice(1)]})).toMatchObject({state:'REVIEW_REQUIRED'})
 })
 it('expires source qualification without a provider refresh and rejects any altered reviewed derivation',async()=>{
  const f=await fixture()
  expect(await validateReviewedRequirementEvidence({...f,evaluationAsOfMs:Date.parse('2027-04-01'),sourceCutoffAtMs:Date.parse('2027-04-01')})).toMatchObject({state:'STALE'})
  const r=f.reviews[0],payload={...r,metadata:{...r.metadata,derivation:{netDebtCrore:'0'}}};const {id:_id,review_hash:_hash,...hashed}=payload
  expect(_id).toBe(r.id);expect(_hash).toBeTruthy()
  expect(await validateReviewedRequirementEvidence({...f,reviews:[{...payload,review_hash:await hashG02(hashed)},...f.reviews.slice(1)]})).toMatchObject({state:'REVIEW_REQUIRED',reason:'DEBT_COMPONENT_DERIVATION_INVALID'})
 })
})
