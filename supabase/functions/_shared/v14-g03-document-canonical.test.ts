import {describe,it,expect} from 'vitest'
import {validateReviewedRequirementEvidence,type RequirementReview} from './v14-reviewed-evidence'
import {G03_DOCUMENT_REVIEW_BATCH as batch,G03_DOCUMENT_KIND,G03_DOCUMENT_REVIEW_KIND,approvedG03DocumentReview,approvedG03DocumentSource} from './v14-g03-document-review'
import {G03_SOURCE_SCOPE,G02_SOURCE_SCOPE,g02ReadUrlAllowed,g02SourcePin,g02R2Key,prepareG02Source,hashG02} from './v14-g02-source-import'
import {g03SourceExecutorQualified} from './v14-g03-executor-identity'
import policy from './v14-g03-pilot-authorization.json'
describe('G03 original scope remains separate from existing G02',()=>{
 it('allows only pinned BEL originals and keeps the G02 three-stock scope',()=>{
  const hash=batch[0].originalHash
  expect(g02SourcePin(hash,G03_SOURCE_SCOPE).symbol).toBe('BEL')
  expect(()=>g02SourcePin(hash)).toThrow('EXACT_ORIGINAL')
  expect(G03_SOURCE_SCOPE.policy.securityIds).toHaveLength(1)
  expect(G02_SOURCE_SCOPE.policy.securityIds).toHaveLength(3)
  expect(()=>g02SourcePin('0'.repeat(64),G03_SOURCE_SCOPE)).toThrow('EXACT_ORIGINAL')
 })
 it('requires its own protected workflow and exact Development object',()=>{
  const hash=batch[0].originalHash,url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com/portfolioai-history-dev/'+g02R2Key(hash,G03_SOURCE_SCOPE)+'?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=240'
  expect(g02ReadUrlAllowed(hash,url,G03_SOURCE_SCOPE)).toBe(true)
  for(const bad of [url.replace('/g03/','/g02/'),url.replace('-dev/','-prod/'),url.replace('Expires=240','Expires=3600')])expect(g02ReadUrlAllowed(hash,bad,G03_SOURCE_SCOPE)).toBe(false)
  const claims={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',event_name:'workflow_dispatch',workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/g03-source-qualification.yml@refs/heads/codex/g02-industry-evidence'}
  expect(g03SourceExecutorQualified(claims)).toBe(true)
  expect(g03SourceExecutorQualified({...claims,workflow_ref:claims.workflow_ref.replace('g03','g02')})).toBe(false)
  expect(g03SourceExecutorQualified({...claims,environment:'Production'})).toBe(false)
 })
 it('registers unknown-publication sources without financial admission or backdating',async()=>{
  const source=await prepareG02Source(batch[0].originalHash,'2026-10-14T13:00:00Z',G03_SOURCE_SCOPE)
  expect(source).toMatchObject({record_kind:'V1_4_G03_REGISTERED_OFFICIAL_ORIGINAL',published_at:null})
  expect(source.raw_payload).toMatchObject({publication_precision:'UNKNOWN',financial_admission:false,proven_availability_at:'2026-10-14T13:00:00Z'})
  expect(source.payload_hash).toBe(await hashG02(source.raw_payload))
 })
})
describe('BEL documentary findings through the actual canonical adapter',()=>{
 it.each(batch)('admits only bound documentary support, preserving limitations: $requirementCode',async b=>{
  const at='2026-10-14T13:00:00+00:00',raw={original_source_record_id:'original',security_id:b.securityId,original_sha256:b.originalHash,fragment:b.fragment,assessment:b.assessment,authorization_reference:policy.directiveSha256},sourceHash=await hashG02(raw)
  const payload={portfolio_id:policy.portfolioId,security_id:b.securityId,requirement_code:b.requirementCode,review_kind:G03_DOCUMENT_REVIEW_KIND,decision:'SUPPORTS',source_record_id:'source',research_document_id:'document',provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.reportingPeriodStart,period_end:b.reportingPeriodEnd,period_type:b.periodType,unit:null,currency:null,consolidation_scope:null,published_at:null,retrieved_at:at,fresh_through:'2027-03-31T00:00:00+00:00',review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:at,supersedes_review_id:null,metadata:{original_sha256:b.originalHash,does_not_prove:b.doesNotProve,review_authorization:{authorization_reference:policy.directiveSha256,authorizing_owner_id:policy.ownerId,executor:'GITHUB_OIDC_G03_OFFICIAL_QUALIFICATION'}}}
  const review:RequirementReview={id:'review',...payload,review_hash:await hashG02(payload)},source={id:'source',source_code:'COMPANY_EXCHANGE_FILING',record_kind:G03_DOCUMENT_KIND,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw}
  const input={portfolioId:policy.portfolioId,portfolioOwnerId:policy.ownerId,securityId:b.securityId,requirementCode:b.requirementCode,family:'TEXT_EVIDENCE_REVIEW' as const,metricCodes:[],minimum:1,reviews:[review],sources:[source],documents:[{id:'document',security_id:b.securityId,reporting_period_start:null,reporting_period_end:null,reporting_period_type:null,published_at:null,canonical_content_hash:b.originalHash,identity_status:'VERIFIED'}],documentSources:[{id:'link',research_document_id:'document',source_record_id:'original',source_code:'COMPANY_EXCHANGE_FILING',content_hash:b.originalHash,source_status:'VERIFIED',provider_document_id:b.originalHash,source_url:G03_SOURCE_SCOPE.pins[0].original_url,retrieved_at:at}],definitions:[],evaluationAsOfMs:Date.parse(at),sourceCutoffAtMs:Date.parse(at),freshnessPolicy:null}
  expect(await validateReviewedRequirementEvidence(input)).toMatchObject({state:'FRESH',reason:'REVIEWED_DOCUMENTARY_SUPPORT_READY'})
  expect(approvedG03DocumentReview(review,policy.ownerId,'NUMERIC_SERIES')).toBe(false)
  expect(approvedG03DocumentReview(review,'foreign','TEXT_EVIDENCE_REVIEW')).toBe(false)
  expect(approvedG03DocumentReview({...review,reviewed_by:policy.ownerId},policy.ownerId,'TEXT_EVIDENCE_REVIEW')).toBe(false)
  expect(approvedG03DocumentReview({...review,requirement_code:'OPERATING_MARGIN_HISTORY'},policy.ownerId,'TEXT_EVIDENCE_REVIEW')).toBe(false)
  expect(approvedG03DocumentSource(review,{...source,raw_payload:{...raw,original_sha256:'0'.repeat(64)}})).toBe(false)
  expect(await validateReviewedRequirementEvidence({...input,reviews:[{...review,review_hash:'a'.repeat(64)}]})).toMatchObject({state:'REVIEW_REQUIRED',reason:'REVIEW_INTEGRITY_HASH_INVALID'})
  expect(await validateReviewedRequirementEvidence({...input,documentSources:[{...input.documentSources[0],content_hash:'b'.repeat(64)}]})).toMatchObject({state:'REVIEW_REQUIRED',reason:'DOCUMENT_SOURCE_CONTENT_HASH_MISMATCH'})
  expect(await validateReviewedRequirementEvidence({...input,evaluationAsOfMs:Date.parse('2028-01-01T00:00:00Z'),sourceCutoffAtMs:Date.parse('2028-01-01T00:00:00Z')})).toMatchObject({state:'STALE',reason:'DOCUMENT_REVIEW_STALE'})
  expect(b.doesNotProve).toContain('overall_READY')
  if(b.requirementCode==='OWNERSHIP_GOVERNANCE'){expect(b.assessment).toContain('non-compliance');expect(b.doesNotProve).toContain('clean_governance')}
 })
})
