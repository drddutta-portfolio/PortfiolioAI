import policy from './v14-g03-pilot-authorization.json' with {type:'json'}
import batch from './v14-g03-document-review-batch.json' with {type:'json'}
export {batch as G03_DOCUMENT_REVIEW_BATCH}
export const G03_DOCUMENT_KIND='V1_4_G03_QUALIFIED_ORIGINAL_EXCERPT'
export const G03_DOCUMENT_REVIEW_KIND='DELEGATED_G03_DOCUMENT_REVIEW'
export function approvedG03DocumentReview(review:{portfolio_id:string;security_id:string;requirement_code:string;review_kind:string;reviewed_by:string|null;supporting_quote?:string|null;metadata:Readonly<Record<string,unknown>>},ownerId:string,family:string){
 const authorization=review.metadata.review_authorization as Record<string,unknown>|undefined
 return family==='TEXT_EVIDENCE_REVIEW'&&ownerId===policy.ownerId&&review.portfolio_id===policy.portfolioId&&review.reviewed_by===null&&review.review_kind===G03_DOCUMENT_REVIEW_KIND&&batch.some(b=>b.securityId===review.security_id&&b.requirementCode===review.requirement_code&&b.fragment===review.supporting_quote)&&authorization?.authorization_reference===policy.directiveSha256&&authorization.authorizing_owner_id===ownerId&&authorization.executor==='GITHUB_OIDC_G03_OFFICIAL_QUALIFICATION'
}
export function approvedG03DocumentSource(review:{security_id:string;supporting_quote:string|null;metadata:Readonly<Record<string,unknown>>;requirement_code?:string},source:{source_code:string;record_kind?:string;raw_payload:Readonly<Record<string,unknown>>}){
 const b=batch.find(x=>x.securityId===review.security_id&&x.requirementCode===review.requirement_code)
 return Boolean(b&&source.source_code==='COMPANY_EXCHANGE_FILING'&&source.record_kind===G03_DOCUMENT_KIND&&source.raw_payload.security_id===b.securityId&&source.raw_payload.original_sha256===b.originalHash&&source.raw_payload.fragment===b.fragment&&review.supporting_quote===b.fragment&&source.raw_payload.assessment===b.assessment&&review.metadata.original_sha256===b.originalHash&&source.raw_payload.authorization_reference===policy.directiveSha256&&typeof source.raw_payload.original_source_record_id==='string')
}
