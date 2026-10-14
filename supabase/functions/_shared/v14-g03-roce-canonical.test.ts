import {describe,it,expect} from 'vitest'
import {G03_ROCE_POLICY as p,G03_ROCE_BATCH as batch,G03_ROCE_SOURCE_KIND,G03_ROCE_REVIEW_KIND,approvedG03RoceReview,approvedG03RoceSource} from './v14-g03-roce-review'
import {validateReviewedRequirementEvidence,reconcileCanonicalAndReviewed,type RequirementReview} from './v14-reviewed-evidence'
import {hashG02} from './v14-g02-source-import'
import {g03RoceExecutorQualified} from './v14-g03-executor-identity'
const definition={code:'ROCE_MANAGEMENT_ANNUAL',canonical_unit:'PERCENT',value_kind:'NUMERIC',is_active:true,freshness_seconds:7776000,definition:{selection:'REVIEWED',period_type:'YEAR',semantic_guard:'CONSISTENT_ISSUER_REPORTED_ROCE_SERIES',source_priority:['ISSUER_ANNUAL_REPORT']}}
async function actualAdapterFixture(){
 const at='2026-10-15T00:00:00+00:00',fresh='2027-01-13T00:00:00+00:00',reviews:RequirementReview[]=[],sources=[]
 for(const b of batch){
  const raw={security_id:b.securityId,original_sha256:b.originalSha256,original_source_record_id:'parent:'+b.originalSha256,fragment:b.fragment,metric_code:b.metricCode,numeric_value:b.numericValue,period_start:b.periodStart,period_end:b.periodEnd,period_type:'YEAR',unit:'PERCENT',consolidation_scope:'STANDALONE',source_basis:b.sourceBasisKey,authorization_reference:p.directiveSha256},sourceHash=await hashG02(raw)
  sources.push({id:b.sourceId,source_code:p.sourceAuthority,record_kind:G03_ROCE_SOURCE_KIND,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw})
  const payload={portfolio_id:p.portfolioId,security_id:b.securityId,requirement_code:b.requirementCode,review_kind:G03_ROCE_REVIEW_KIND,decision:'SUPPORTS',source_record_id:b.sourceId,research_document_id:b.originalSha256,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.periodStart,period_end:b.periodEnd,period_type:'YEAR',unit:'PERCENT',currency:null,consolidation_scope:'STANDALONE',published_at:null,retrieved_at:at,fresh_through:fresh,review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:at,supersedes_review_id:null,metadata:{metric_code:b.metricCode,numeric_value:b.numericValue,review_authorization:{authorization_reference:p.directiveSha256,authorizing_owner_id:p.ownerId,executor:'GITHUB_OIDC_G03_FIXED_ROCE_QUALIFICATION'},source_binding:{kind:'TABLE_CELL',fragment:b.fragment,metric_label:'Return on Capital Employed (in %age)',period_label:b.fiscalLabel,exact_value:b.numericValue,entity_id:'L32309KA1954GOI000787',period_start:b.periodStart,period_end:b.periodEnd,period_type:'YEAR',period_start_anchor:b.fiscalLabel,period_end_anchor:b.fiscalLabel,scale:'1',conversion:'IDENTITY'}}}
  reviews.push({id:b.reviewId,...payload,review_hash:await hashG02(payload)})
 }
 const hashes=[...new Set(batch.map(x=>x.originalSha256))],documents=hashes.map(hash=>({id:hash,security_id:p.securityIds[0],reporting_period_start:null,reporting_period_end:null,reporting_period_type:null,published_at:null,canonical_content_hash:hash,identity_status:'VERIFIED'})),documentSources=hashes.map(hash=>({id:'link:'+hash,research_document_id:hash,source_record_id:'parent:'+hash,source_code:'COMPANY_EXCHANGE_FILING',content_hash:hash,source_status:'VERIFIED',provider_document_id:hash,source_url:batch.find(x=>x.originalSha256===hash)!.originalSourceUrl,retrieved_at:at}))
 return {portfolioId:p.portfolioId,portfolioOwnerId:p.ownerId,securityId:p.securityIds[0],requirementCode:'ROCE_OR_ROIC',family:'NUMERIC_SERIES' as const,metricCodes:['ROCE_ANNUAL','ROCE_MANAGEMENT_ANNUAL'],minimum:3,reviews,sources,documents,documentSources,definitions:[definition],evaluationAsOfMs:Date.parse(at),sourceCutoffAtMs:Date.parse(at),freshnessPolicy:null}
}
describe('fixed BEL issuer ROCE admission through the actual canonical adapter',()=>{
 it('admits three dated standalone issuer facts without inventing publication or recomputing ratios',async()=>{
  const f=await actualAdapterFixture(),r=await validateReviewedRequirementEvidence(f)
  expect(r).toMatchObject({state:'FRESH',reason:'REVIEWED_CANONICAL_OBSERVATION_READY'})
  expect(r?.observations.map(x=>[x.period_end,x.numeric_value,x.consolidation_scope,x.source_code])).toEqual(batch.map(b=>[b.periodEnd,b.numericValue,'STANDALONE','ISSUER_ANNUAL_REPORT']))
  expect(r?.observations.every(x=>x.published_at===null)).toBe(true)
  expect(r?.lineage).toMatchObject({sourceSelectionScope:p.version,preservedLegacyEvidence:true})
  expect(await validateReviewedRequirementEvidence({...f,reviews:f.reviews.slice(1)})).toMatchObject({state:'INSUFFICIENT',reason:'DISTINCT_REPORTING_PERIODS_INSUFFICIENT'})
 })
 it('rejects another actor, stock, family, metric and altered original/value basis',async()=>{
  const f=await actualAdapterFixture(),review=f.reviews[0],source=f.sources[0]
  expect(approvedG03RoceReview(review,p.ownerId,'NUMERIC_SERIES')).toBe(true)
  expect(approvedG03RoceReview(review,p.ownerId,'TEXT_EVIDENCE_REVIEW')).toBe(false)
  for(const change of [{security_id:'foreign'},{reviewed_by:p.ownerId},{requirement_code:'VALUATION'},{metadata:{...review.metadata,numeric_value:'36.45'}},{id:'foreign'}])expect(approvedG03RoceReview({...review,...change},p.ownerId,'NUMERIC_SERIES')).toBe(false)
  for(const change of [{source_code:'TRENDLYNE_MCP'},{raw_payload:{...source.raw_payload,numeric_value:'36.45'}},{raw_payload:{...source.raw_payload,original_sha256:'0'.repeat(64)}},{raw_payload:{...source.raw_payload,consolidation_scope:'CONSOLIDATED'}}])expect(approvedG03RoceSource(review,{...source,...change})).toBe(false)
  expect(await validateReviewedRequirementEvidence({...f,reviews:[{...review,review_hash:'0'.repeat(64)},...f.reviews.slice(1)]})).toMatchObject({state:'REVIEW_REQUIRED',reason:'REVIEW_INTEGRITY_HASH_INVALID'})
  expect(await validateReviewedRequirementEvidence({...f,documents:f.documents.map(d=>({...d,canonical_content_hash:'a'.repeat(64)}))})).toMatchObject({state:'REVIEW_REQUIRED',reason:'DOCUMENT_SOURCE_CONTENT_HASH_MISMATCH'})
 })
 it('preserves only the explicitly pinned unqualified legacy candidate while selecting the qualified issuer series',async()=>{
  const f=await actualAdapterFixture(),reviewed=await validateReviewedRequirementEvidence(f),legacy=p.legacyUnqualifiedCandidate
  const row={id:legacy.id,metric_code:legacy.metricCode,numeric_value:legacy.numericValue,text_value:null,boolean_value:null,date_value:null,unit:'PERCENT',currency:null,consolidation_scope:'UNKNOWN',period_start:null,period_end:null,period_type:'YEAR',retrieved_at:'2026-09-26T19:35:31+00:00',fresh_until:'2026-12-25T19:35:31+00:00',published_at:null,evidence_status:'AVAILABLE',source_code:legacy.sourceCode,source_record_id:legacy.sourceId}
  const base={reviewed,definitions:[definition,{...definition,code:'ROCE_ANNUAL',definition:{selection:'REVIEWED',period_type:'YEAR',provider:'TRENDLYNE_MCP'}}],minimum:3,evaluationAsOfMs:f.evaluationAsOfMs,sourceCutoffAtMs:f.sourceCutoffAtMs,family:f.family}
  expect(reconcileCanonicalAndReviewed({...base,canonicalRows:[row]})).toMatchObject({authority:'REVIEW',reason:'G03_FIXED_ISSUER_SERIES_SELECTED_LEGACY_UNQUALIFIED_RETAINED',validation:{state:'FRESH'}})
  for(const change of [{id:'foreign'},{numeric_value:'31.89'},{period_end:'2026-03-31'},{consolidation_scope:'STANDALONE'},{source_record_id:'foreign'}])expect(reconcileCanonicalAndReviewed({...base,canonicalRows:[{...row,...change}]}).validation.state).not.toBe('FRESH')
  expect(reconcileCanonicalAndReviewed({...base,canonicalRows:[{...row,evidence_status:'CONFLICTING'}]})).toMatchObject({validation:{state:'CONFLICTING'},reason:'CANONICAL_CONFLICT_PRESERVED'})
  expect(reconcileCanonicalAndReviewed({...base,canonicalRows:[row],reviewed:reviewed&&{...reviewed,state:'STALE'}}).validation.state).not.toBe('FRESH')
  expect(reconcileCanonicalAndReviewed({...base,canonicalRows:[row],reviewed:reviewed&&{...reviewed,observations:reviewed.observations.slice(1)}}).validation.state).not.toBe('FRESH')
 })
 it('retains publication, source-priority, scope and freshness rejection',async()=>{
  const f=await actualAdapterFixture()
  expect(await validateReviewedRequirementEvidence({...f,definitions:[{...definition,definition:{...definition.definition,source_priority:['COMPANY_EXCHANGE_FILING']}}]})).toMatchObject({state:'REVIEW_REQUIRED',reason:'SOURCE_AUTHORITY_MISMATCH'})
  expect(await validateReviewedRequirementEvidence({...f,evaluationAsOfMs:Date.parse('2027-02-01T00:00:00Z'),sourceCutoffAtMs:Date.parse('2027-02-01T00:00:00Z')})).toMatchObject({state:'STALE',reason:'ONLY_STALE_REQUIRED_EVIDENCE'})
  expect(await validateReviewedRequirementEvidence({...f,sourceCutoffAtMs:Date.parse('2026-10-14T23:59:00Z')})).toMatchObject({state:'REVIEW_REQUIRED',reason:'REVIEW_EVALUATION_CONTRACT_INVALID'})
 })
 it('uses a distinct protected workflow and cannot reuse documentary/grant identities',()=>{
  const claims={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',event_name:'workflow_dispatch',workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/g03-roce-qualification.yml@refs/heads/codex/g02-industry-evidence'}
  expect(g03RoceExecutorQualified(claims)).toBe(true)
  for(const change of [{workflow_ref:claims.workflow_ref.replace('roce','source')},{environment:'Production'},{repository_id:'foreign'},{ref:'refs/heads/main'}])expect(g03RoceExecutorQualified({...claims,...change})).toBe(false)
 })
})
