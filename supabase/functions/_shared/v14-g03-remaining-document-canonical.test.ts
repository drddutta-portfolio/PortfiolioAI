import {describe,it,expect} from 'vitest'
import {validateReviewedRequirementEvidence,type RequirementReview} from './v14-reviewed-evidence'
import {G03_REMAINING_DOCUMENT_BATCH as batch,G03_DOCUMENT_KIND,G03_DOCUMENT_REVIEW_KIND,approvedG03DocumentReview,approvedG03DocumentSource} from './v14-g03-document-review'
import {G03_REMAINING_SOURCE_SCOPE,G03_SOURCE_SCOPE,g02SourcePin,hashG02} from './v14-g02-source-import'
import {g03RemainingExecutorQualified} from './v14-g03-executor-identity'
import policy from './v14-g03-remaining-authorization.json'
describe('remaining G03 scope preserves BEL and requires the exact protected workflow',()=>{
 it('keeps six security identities, twelve documentary findings and no numeric/provider authority',()=>{
  expect(policy.securityIds).toHaveLength(6);expect(batch).toHaveLength(12)
  expect(policy.numericReviewAllowed).toBe(false);expect(policy.providerCallsAllowed).toBe(0)
  for(const pin of G03_REMAINING_SOURCE_SCOPE.pins){expect(policy.securityIds).toContain(pin.security_id);expect(()=>g02SourcePin(pin.original_sha256,G03_SOURCE_SCOPE)).toThrow('EXACT_ORIGINAL')}
  expect(G03_SOURCE_SCOPE.policy.securityIds).toEqual(['fdec39e9-08a7-418d-ae96-9d8ce834d26c'])
 })
 it('rejects other workflows, forks, environments and events',()=>{
  const c={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',event_name:'workflow_dispatch',workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/g03-remaining-document-qualification.yml@refs/heads/codex/g02-industry-evidence'}
  expect(g03RemainingExecutorQualified(c)).toBe(true)
  for(const x of [{event_name:'push'},{environment:'Production'},{repository_id:'foreign'},{ref:'refs/heads/main'},{workflow_ref:c.workflow_ref.replace('remaining-document-qualification','source-qualification')}])expect(g03RemainingExecutorQualified({...c,...x})).toBe(false)
 })
})
describe('remaining G03 documentary findings through the actual canonical adapter',()=>{
 it.each(batch)('admits only bound documentary support, preserving limitations: $requirementCode',async b=>{
  const at='2026-10-16T04:00:00+00:00',raw={original_source_record_id:'original',security_id:b.securityId,original_sha256:b.originalHash,fragment:b.fragment,assessment:b.assessment,authorization_reference:policy.directiveSha256},sourceHash=await hashG02(raw)
  const payload={portfolio_id:policy.portfolioId,security_id:b.securityId,requirement_code:b.requirementCode,review_kind:G03_DOCUMENT_REVIEW_KIND,decision:'SUPPORTS',source_record_id:'source',research_document_id:'document',provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.reportingPeriodStart,period_end:b.reportingPeriodEnd,period_type:b.periodType,unit:null,currency:null,consolidation_scope:null,published_at:null,retrieved_at:at,fresh_through:new Date(Date.parse(b.reportingPeriodEnd+'T00:00:00Z')+365*86400000).toISOString(),review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:at,supersedes_review_id:null,metadata:{original_sha256:b.originalHash,does_not_prove:b.doesNotProve,review_authorization:{authorization_reference:policy.directiveSha256,authorizing_owner_id:policy.ownerId,executor:'GITHUB_OIDC_G03_OFFICIAL_QUALIFICATION'}}}
  const review:RequirementReview={id:'review',...payload,review_hash:await hashG02(payload)},source={id:'source',source_code:'COMPANY_EXCHANGE_FILING',record_kind:G03_DOCUMENT_KIND,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw}
  const input={portfolioId:policy.portfolioId,portfolioOwnerId:policy.ownerId,securityId:b.securityId,requirementCode:b.requirementCode,family:'TEXT_EVIDENCE_REVIEW' as const,metricCodes:[],minimum:1,reviews:[review],sources:[source],documents:[{id:'document',security_id:b.securityId,reporting_period_start:null,reporting_period_end:null,reporting_period_type:null,published_at:null,canonical_content_hash:b.originalHash,identity_status:'VERIFIED'}],documentSources:[{id:'link',research_document_id:'document',source_record_id:'original',source_code:'COMPANY_EXCHANGE_FILING',content_hash:b.originalHash,source_status:'VERIFIED',provider_document_id:b.originalHash,source_url:g02SourcePin(b.originalHash,G03_REMAINING_SOURCE_SCOPE).original_url,retrieved_at:at}],definitions:[],evaluationAsOfMs:Date.parse(at),sourceCutoffAtMs:Date.parse(at),freshnessPolicy:null}
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
  expect(b.doesNotProve).toContain('clean_governance')
  expect(approvedG03DocumentReview({...review,period_end:'2025-03-31'},policy.ownerId,'TEXT_EVIDENCE_REVIEW')).toBe(false)
  expect(approvedG03DocumentReview({...review,fresh_through:'2028-03-31T00:00:00Z'},policy.ownerId,'TEXT_EVIDENCE_REVIEW')).toBe(false)
 })
})
