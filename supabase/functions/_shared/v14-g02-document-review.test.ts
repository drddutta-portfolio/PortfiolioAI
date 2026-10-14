import {describe,it,expect} from 'vitest'
import {approvedG02DocumentReview,approvedG02DocumentSource,G02_DOCUMENT_REVIEW_BATCH as batch,G02_DOCUMENT_KIND,G02_DOCUMENT_REVIEW_KIND,g02PostgresTimestamp} from './v14-g02-document-review'
import policy from './v14-g02-owner-authorization.json'
describe('owner-delegated G02 documentary evidence',()=>{
 const b=batch[0],review={portfolio_id:policy.portfolioId,security_id:b.securityId,requirement_code:'BUSINESS_DURABILITY',review_kind:G02_DOCUMENT_REVIEW_KIND,reviewed_by:null,supporting_quote:b.fragment,metadata:{original_sha256:b.originalHash,review_authorization:{authorization_reference:policy.directiveSha256,authorizing_owner_id:policy.ownerId,executor:'GITHUB_OIDC_G02_OFFICIAL_QUALIFICATION'}}}
 const source={source_code:'COMPANY_EXCHANGE_FILING',record_kind:G02_DOCUMENT_KIND,raw_payload:{security_id:b.securityId,original_sha256:b.originalHash,fragment:b.fragment,assessment:b.assessment,authorization_reference:policy.directiveSha256}}
 it('admits only the recorded documentary scope without owner impersonation',()=>{expect(approvedG02DocumentReview(review,policy.ownerId,'TEXT_EVIDENCE_REVIEW')).toBe(true);expect(approvedG02DocumentSource(review,source)).toBe(true)})
 it('rejects numeric/governance scopes, another owner and original/source substitutions',()=>{expect(approvedG02DocumentReview(review,policy.ownerId,'NUMERIC_SERIES')).toBe(false);expect(approvedG02DocumentReview({...review,requirement_code:'OWNERSHIP_GOVERNANCE'},policy.ownerId,'TEXT_EVIDENCE_REVIEW')).toBe(false);expect(approvedG02DocumentReview(review,'other','TEXT_EVIDENCE_REVIEW')).toBe(false);expect(approvedG02DocumentSource(review,{...source,raw_payload:{...source.raw_payload,original_sha256:'fake'}})).toBe(false);expect(approvedG02DocumentSource({...review,supporting_quote:'manufactured'},source)).toBe(false)})
})

describe('review integrity timestamp serialization',()=>{it('matches PostgreSQL UTC fractional normalization without changing the instant',()=>{expect(g02PostgresTimestamp('2026-10-13T20:49:54.180Z')).toBe('2026-10-13T20:49:54.18+00:00');expect(g02PostgresTimestamp('2026-10-13T20:49:54.000Z')).toBe('2026-10-13T20:49:54+00:00');expect(g02PostgresTimestamp('2026-10-13T20:49:54.182Z')).toBe('2026-10-13T20:49:54.182+00:00')})})

describe('Industrials governance documentary scope',()=>{
 it('admits only the fixed requirement and preserves adverse disclosed evidence',()=>{
  const b=batch.find(x=>x.symbol==='CGPOWER'&&x.requirementCode==='OWNERSHIP_GOVERNANCE')!
  expect(b.assessment).toContain('unresolved governance risk')
  const review={portfolio_id:policy.portfolioId,security_id:b.securityId,requirement_code:b.requirementCode,review_kind:G02_DOCUMENT_REVIEW_KIND,reviewed_by:null,supporting_quote:b.fragment,metadata:{original_sha256:b.originalHash,review_authorization:{authorization_reference:policy.directiveSha256,authorizing_owner_id:policy.ownerId,executor:'GITHUB_OIDC_G02_OFFICIAL_QUALIFICATION'}}}
  expect(approvedG02DocumentReview(review,policy.ownerId,'TEXT_EVIDENCE_REVIEW')).toBe(true)
  expect(approvedG02DocumentReview(review,policy.ownerId,'OWNERSHIP_4Q')).toBe(false)
  const source={source_code:'COMPANY_EXCHANGE_FILING',record_kind:G02_DOCUMENT_KIND,raw_payload:{security_id:b.securityId,original_sha256:b.originalHash,fragment:b.fragment,assessment:b.assessment,authorization_reference:policy.directiveSha256}}
  expect(approvedG02DocumentSource(review,source)).toBe(true)
  expect(approvedG02DocumentSource({...review,requirement_code:'BUSINESS_DURABILITY'},source)).toBe(false)
 })
})
